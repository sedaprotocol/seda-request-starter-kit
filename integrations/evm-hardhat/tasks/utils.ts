import * as fs from 'node:fs';
import * as path from 'node:path';
import dotenv from 'dotenv';
import type { Network, NetworkConfig } from 'hardhat/types';
import { type SedaConfig, networkConfigs } from '../seda.config';

dotenv.config();

/**
 * Helper function to fetch the deployed contract address from the deployment file.
 * @param network NetworkConfig object containing network details.
 * @param contractName The full name of the contract (as stored in the deployment JSON file).
 * @returns The deployed contract address as a string.
 * @throws Error if the deployment file or contract address is not found.
 */
export function getDeployedContract(network: Network, contractName: string): string {
  // Path to our new deployments file
  const deploymentPath = path.join(__dirname, '../deployments/addresses.json');

  // Check if the deployment file exists
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployments file not found at ${deploymentPath}`);
  }

  // Parse the deployment JSON file to fetch contract addresses
  const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));

  // Create network key with name and chainId
  // const networkKey = `${network.name}-${network.chainId}`;
  const networkKey = `${network.name}-${network.config.chainId}`;

  // Check if network exists in deployments
  if (!deployments[networkKey]) {
    throw new Error(`No deployments found for network ${networkKey}`);
  }

  // For PriceFeed, use contractAddress
  if (contractName === 'PriceFeed') {
    return deployments[networkKey].contractAddress;
  }

  throw new Error(`Contract ${contractName} not found in deployment file for network ${networkKey}`);
}

/**
 * Fetches the SEDA network configuration based on the provided network name.
 * @param network The name of the network (e.g., 'mainnet', 'goerli', etc.).
 * @returns SedaConfig The configuration object for the given network.
 * @throws Error if the network configuration is not found.
 */
export function getSedaConfig(network: string): SedaConfig {
  const config = networkConfigs[network];
  if (!config) {
    throw new Error(`SEDA network configuration for ${network} not found`);
  }

  return config;
}

/**
 * Retrieves the Oracle Program ID from the environment variables.
 * Ensures the ID is correctly formatted as a hex string.
 * @returns string The Oracle Program ID (hex-encoded).
 * @throws Error if the ORACLE_PROGRAM_ID is not set or invalid.
 */
export function getOracleProgramId(): string {
  // Retrieve Oracle Program ID from environment variables
  const oracleProgramId = process.env.ORACLE_PROGRAM_ID || '';

  // Check if the Oracle Program ID is not empty
  if (!oracleProgramId) {
    throw new Error(`SEDA Data Request Binary ID is unknown. Please set the 'ORACLE_PROGRAM_ID' environment variable.`);
  }

  // Ensure the Oracle Program ID is properly formatted as a hex string
  if (oracleProgramId.startsWith('0x')) {
    return oracleProgramId;
  }

  // Automatically add "0x" if missing
  return `0x${oracleProgramId}`;
}
