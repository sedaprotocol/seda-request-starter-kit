import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

// PriceFeed Tasks
import './tasks';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    baseSepolia: {
      accounts: process.env.EVM_PRIVATE_KEY ? [process.env.EVM_PRIVATE_KEY] : [],
      url: 'https://sepolia.base.org',
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: process.env.BASE_SEPOLIA_ETHERSCAN_API_KEY || '',
    customChains: [
      {
        chainId: 84532,
        network: 'baseSepolia',
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
};

export default config;
