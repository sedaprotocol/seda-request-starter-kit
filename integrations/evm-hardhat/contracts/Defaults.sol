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
    function buildRequestInputs(bytes memory execInputs) internal view virtual returns (SedaDataTypes.RequestInputs memory) {
        return SedaDataTypes.RequestInputs({
            execProgramId: ORACLE_PROGRAM_ID,
            tallyProgramId: ORACLE_PROGRAM_ID,
            gasPrice: 2000,                    // SEDA tokens per gas unit
            execGasLimit: 50_000_000_000_000,  // Execution gas limit
            tallyGasLimit: 20_000_000_000_000, // Tally gas limit  
            replicationFactor: 1,               // Number of required executors
            execInputs: execInputs,
            tallyInputs: hex"00",               // No tally inputs needed
            consensusFilter: hex"00",           // No consensus filter
            memo: abi.encodePacked(block.number) // Block number as memo
        });
    }
}
