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
     * @notice Creates a new EVAA Protocol price request on the SEDA network
     * @dev Demonstrates how to structure and send a request to SEDA
     * @param requestFee The fee for the request
     * @param resultFee The fee for the result
     * @param batchFee The fee for the batch
     * @return The ID of the created request
     */
    function transmit(uint256 requestFee, uint256 resultFee, uint256 batchFee) external payable returns (bytes32) {
        string memory execInput = "evaa-protocol";
        SedaDataTypes.RequestInputs memory inputs = buildRequestInputs(bytes(execInput));

        // Pass the msg.value as fees to the SEDA core
        requestId = SEDA_CORE.postRequest{value: msg.value}(inputs, requestFee, resultFee, batchFee);
        return requestId;
    }

    /**
     * @notice Retrieves the result of the latest request
     * @dev Shows how to fetch and interpret SEDA request results
     * @return The price as uint128, or 0 if no consensus was reached
     */
    function latestAnswer() public view returns (uint128) {
        if (requestId == bytes32(0)) revert RequestNotTransmitted();

        SedaDataTypes.Result memory result = SEDA_CORE.getResult(requestId);

        if (result.consensus && result.exitCode == 0) {
            return uint128(bytes16(result.result));
        }

        return 0;
    }
}
