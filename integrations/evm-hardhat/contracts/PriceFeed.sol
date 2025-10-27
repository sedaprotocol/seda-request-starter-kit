// SPDX-License-Identifier: MIT
/**
 * NOTICE: This is an example contract to demonstrate SEDA network functionality.
 * It is for educational purposes only and should not be used in production.
 */

pragma solidity 0.8.28;

import {ISedaCore} from "@seda-protocol/evm/contracts/interfaces/ISedaCore.sol";
import {SedaDataTypes} from "@seda-protocol/evm/contracts/libraries/SedaDataTypes.sol";
import {SedaDefaults} from "./Defaults.sol";

/**
 * @title PriceFeed
 * @author Open Oracle Association
 * @notice An example showing how to create and interact with SEDA network requests.
 * @dev This contract demonstrates basic SEDA request creation and result fetching.
 */
contract PriceFeed is SedaDefaults {
    /// @notice Instance of the SedaCore contract
    ISedaCore public immutable SEDA_CORE;

    /// @notice ID of the most recent request
    bytes32 public requestId;

    /// @notice Emitted when a new price request is submitted
    event PriceRequested(bytes32 indexed requestId, string token, uint256 timestamp);

    /// @notice Thrown when trying to fetch results before any request is transmitted
    error RequestNotTransmitted();

    /**
     * @notice Sets up the contract with SEDA network parameters
     * @param _sedaCoreAddress Address of the SedaCore contract
     * @param _oracleProgramId ID of the WASM binary for handling requests
     */
    constructor(address _sedaCoreAddress, bytes32 _oracleProgramId) SedaDefaults(_oracleProgramId) {
        SEDA_CORE = ISedaCore(_sedaCoreAddress);
    }

    /**
     * @notice DRY-RUN: Simulate transmit without executing
     * @param token Token ID to request (e.g., "bitcoin", "ethereum", "evaa-protocol")
     * @return canSubmit Whether the request can be submitted
     * @return estimatedCost Total ETH cost (gas estimate + fees)
     * @return warnings Array of warning messages
     * @dev Use this to debug why transmit might fail before spending gas
     */
    function dryRun(
        string calldata token
    ) external view returns (bool canSubmit, uint256 estimatedCost, string[] memory warnings) {
        warnings = new string[](5);
        uint256 warningCount = 0;

        // Validate token input
        (bool valid, string memory reason) = validateRequest(bytes(token));
        if (!valid) {
            warnings[warningCount++] = reason;
            canSubmit = false;

            // Resize warnings array
            assembly {
                mstore(warnings, warningCount)
            }
            return (canSubmit, 0, warnings);
        }

        // Check Oracle Program ID
        if (ORACLE_PROGRAM_ID == bytes32(0)) {
            warnings[warningCount++] = "Oracle Program ID not configured";
            canSubmit = false;

            assembly {
                mstore(warnings, warningCount)
            }
            return (canSubmit, 0, warnings);
        }

        // Estimate cost (gas + fees)
        uint256 gasEstimate = 300000; // Typical gas for transmit
        uint256 gasPrice = tx.gasprice > 0 ? tx.gasprice : 1 gwei;
        uint256 feeEstimate = calculateRequiredFee(DEFAULT_REQUEST_FEE, DEFAULT_RESULT_FEE, DEFAULT_BATCH_FEE);
        estimatedCost = (gasEstimate * gasPrice) + feeEstimate;

        // Check balance (if msg.sender is not address(0))
        if (msg.sender != address(0) && msg.sender.balance < estimatedCost) {
            warnings[warningCount++] = "Insufficient balance for transaction";
        }

        // Check if token string is too long
        if (bytes(token).length > 256) {
            warnings[warningCount++] = "Token ID too long (max 256 chars)";
        }

        canSubmit = (warningCount == 0);

        // Resize warnings array
        assembly {
            mstore(warnings, warningCount)
        }
    }

    /**
     * @notice Simple transmit with custom token and zero fees
     * @param token Token ID to request (e.g., "bitcoin", "ethereum", "evaa-protocol")
     * @return The ID of the created request
     * @dev Perfect for testing - uses default zero fees
     */
    function transmit(string calldata token) external returns (bytes32) {
        return _transmit(token, DEFAULT_REQUEST_FEE, DEFAULT_RESULT_FEE, DEFAULT_BATCH_FEE);
    }

    /**
     * @notice Advanced transmit with full control over fees
     * @param token Token ID to request
     * @param requestFee Fee for request submission
     * @param resultFee Fee for result submission
     * @param batchFee Fee for batch processing
     * @return The ID of the created request
     * @dev For production use with custom fee structure
     */
    function transmit(
        string calldata token,
        uint256 requestFee,
        uint256 resultFee,
        uint256 batchFee
    ) external payable returns (bytes32) {
        uint256 requiredFee = calculateRequiredFee(requestFee, resultFee, batchFee);
        if (msg.value < requiredFee) {
            revert InsufficientFees(msg.value, requiredFee);
        }

        return _transmit(token, requestFee, resultFee, batchFee);
    }

    /**
     * @notice Internal transmit logic
     * @param token Token ID to request
     * @param requestFee Fee for request submission
     * @param resultFee Fee for result submission
     * @param batchFee Fee for batch processing
     * @return The ID of the created request
     */
    function _transmit(
        string memory token,
        uint256 requestFee,
        uint256 resultFee,
        uint256 batchFee
    ) internal returns (bytes32) {
        // Validate before submitting
        (bool valid, string memory reason) = validateRequest(bytes(token));
        if (!valid) {
            revert InvalidToken(token, reason);
        }

        // Build and submit request
        SedaDataTypes.RequestInputs memory inputs = buildRequestInputs(bytes(token));
        requestId = SEDA_CORE.postRequest{value: msg.value}(inputs, requestFee, resultFee, batchFee);

        emit PriceRequested(requestId, token, block.timestamp);

        return requestId;
    }

    /**
     * @notice Check if result is ready without reverting
     * @return ready Whether result is available
     * @return consensusReached Whether executors agreed on the result
     * @dev Unlike latestAnswer(), this won't revert if no result exists
     */
    function isResultReady() public view returns (bool ready, bool consensusReached) {
        if (requestId == bytes32(0)) {
            return (false, false);
        }

        try SEDA_CORE.getResult(requestId) returns (SedaDataTypes.Result memory result) {
            return (true, result.consensus && result.exitCode == 0);
        } catch {
            return (false, false);
        }
    }

    /**
     * @notice Retrieves the result of the latest request
     * @return The price as uint128, or 0 if no consensus was reached
     * @dev Reverts if no request has been submitted
     */
    function latestAnswer() public view returns (uint128) {
        if (requestId == bytes32(0)) revert RequestNotTransmitted();

        SedaDataTypes.Result memory result = SEDA_CORE.getResult(requestId);

        if (result.consensus && result.exitCode == 0) {
            return uint128(bytes16(result.result));
        }

        return 0;
    }

    /**
     * @notice Get full result details for debugging
     * @return result The complete Result struct from SEDA
     * @dev Shows ALL fields including gas used, timestamps, consensus, exit code, etc.
     */
    function getFullResult() external view returns (SedaDataTypes.Result memory result) {
        if (requestId == bytes32(0)) revert RequestNotTransmitted();
        return SEDA_CORE.getResult(requestId);
    }
}
