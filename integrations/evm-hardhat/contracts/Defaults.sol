// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SedaDataTypes} from "@seda-protocol/evm/contracts/libraries/SedaDataTypes.sol";

/**
 * @title SedaDefaults
 * @author Open Oracle Association
 * @notice Provides sensible default configurations for SEDA Oracle requests
 * @dev Inherit from this contract to use standardized request parameters
 */
abstract contract SedaDefaults {
    /// @notice ID of the Oracle Program on the SEDA network
    bytes32 public immutable ORACLE_PROGRAM_ID;

    /// @notice Default fees for testnet usage (0 fees for testing)
    uint256 public constant DEFAULT_REQUEST_FEE = 0;
    uint256 public constant DEFAULT_RESULT_FEE = 0;
    uint256 public constant DEFAULT_BATCH_FEE = 0;

    /// @notice Default gas limits (safe values for most use cases)
    uint64 public constant DEFAULT_EXEC_GAS_LIMIT = 50_000_000_000_000;
    uint64 public constant DEFAULT_TALLY_GAS_LIMIT = 20_000_000_000_000;

    /// @notice Default gas price in SEDA tokens per gas unit
    uint128 public constant DEFAULT_GAS_PRICE = 2000;

    /// @notice Default replication factor (minimum is 1)
    uint16 public constant DEFAULT_REPLICATION_FACTOR = 1;

    /// @notice Custom errors
    error InsufficientFees(uint256 provided, uint256 required);
    error InvalidToken(string token, string reason);

    /**
     * @notice Initialize with the Oracle Program ID
     * @param _oracleProgramId The ID of your deployed Oracle Program
     */
    constructor(bytes32 _oracleProgramId) {
        ORACLE_PROGRAM_ID = _oracleProgramId;
    }

    /**
     * @notice Builds a RequestInputs struct with sensible defaults
     * @param execInputs The input data for the Oracle Program (e.g., "evaa-protocol")
     * @return inputs The configured RequestInputs struct
     * @dev Override this function if you need different gas limits or replication factors
     */
    function buildRequestInputs(
        bytes memory execInputs
    ) internal view virtual returns (SedaDataTypes.RequestInputs memory) {
        return
            SedaDataTypes.RequestInputs({
                execProgramId: ORACLE_PROGRAM_ID,
                tallyProgramId: ORACLE_PROGRAM_ID,
                gasPrice: DEFAULT_GAS_PRICE,
                execGasLimit: DEFAULT_EXEC_GAS_LIMIT,
                tallyGasLimit: DEFAULT_TALLY_GAS_LIMIT,
                replicationFactor: DEFAULT_REPLICATION_FACTOR,
                execInputs: execInputs,
                tallyInputs: hex"00",
                consensusFilter: hex"00",
                memo: abi.encodePacked(block.number)
            });
    }

    // TODO: Should we leave a more complex example with two oracles and consensus filter?

    /**
     * @notice Validates request inputs before submission
     * @param execInputs The input data to validate
     * @return isValid Whether the request inputs are valid
     * @return reason Human-readable error reason if invalid
     */
    function validateRequest(bytes memory execInputs) public view virtual returns (bool isValid, string memory reason) {
        if (execInputs.length == 0) {
            return (false, "execInputs cannot be empty");
        }
        if (ORACLE_PROGRAM_ID == bytes32(0)) {
            return (false, "Oracle Program ID not set");
        }
        return (true, "");
    }

    /**
     * @notice Calculates the total required fee for a request
     * @param requestFee Fee for request submission
     * @param resultFee Fee for result submission
     * @param batchFee Fee for batch processing
     * @return total The sum of all fees
     */
    function calculateRequiredFee(
        uint256 requestFee,
        uint256 resultFee,
        uint256 batchFee
    ) public pure returns (uint256 total) {
        return requestFee + resultFee + batchFee;
    }

    /**
     * @notice Convert raw price (with 6 decimals) to human-readable string
     * @param rawPrice The raw price value (e.g., 11340000)
     * @return Human-readable price string (e.g., "11.34 USD")
     */
    function formatPrice(uint128 rawPrice) public pure returns (string memory) {
        uint256 dollars = rawPrice / 1_000_000;
        uint256 cents = (rawPrice % 1_000_000) / 10_000;

        // Format cents to always show 2 digits
        string memory centsStr = uint2str(cents);
        if (cents < 10) {
            centsStr = string(abi.encodePacked("0", centsStr));
        }

        return string(abi.encodePacked(uint2str(dollars), ".", centsStr, " USD"));
    }

    /**
     * @notice Helper function to convert uint to string
     * @param _i The uint to convert
     * @return str The string representation
     */
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }

        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;

        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }

        str = string(bstr);
    }
}
