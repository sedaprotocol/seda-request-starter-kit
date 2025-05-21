import * as fs from 'node:fs';
import * as path from 'node:path';
import { createInterface } from 'node:readline';
import MockSedaCore from '@seda-protocol/evm/artifacts/contracts/mocks/MockSedaCore.sol/MockSedaCore.json';
import { priceFeedScope } from '.';
import { getSedaConfig } from './utils';
import { getOracleProgramId } from './utils';

// Define a type for deployment info
interface DeploymentInfo {
  contractAddress: string;
  coreAddress: string;
  binaryId: string;
  timestamp: number;
  deployer: string;
}

/**
 * Task: Deploys the PriceFeed contract.
 * Optional parameters:
 * - coreAddress: The SEDA Core contract address
 * - binaryId: The Oracle program ID (binary ID)
 * - force: Force overwrite if deployment exists
 * - verify: Verify contract on the blockchain explorer
 * If parameters are not provided, they are fetched from configuration.
 */
priceFeedScope
  .task('deploy', 'Deploys the PriceFeed contract')
  .addOptionalParam('coreAddress', 'The SEDA Core contract address')
  .addOptionalParam('binaryId', 'The Oracle program ID (binary ID)')
  .addFlag('force', 'Force overwrite if deployment exists')
  .addFlag('verify', 'Verify contract on the blockchain explorer')
  .setAction(async ({ coreAddress, binaryId, force, verify }, hre) => {
    try {
      // Get network-specific parameters if not provided
      if (!coreAddress) {
        if (hre.network.name === 'hardhat') {
          console.log('Local deployment: Deploying MockSedaCore...');

          // Deploy MockSedaCore for local testing
          const SedaCore = await hre.ethers.getContractFactoryFromArtifact(MockSedaCore);
          const mockSedaCore = await SedaCore.deploy();
          await mockSedaCore.waitForDeployment();

          coreAddress = await mockSedaCore.getAddress();
          console.log(`MockSedaCore deployed at: ${coreAddress}`);
        } else {
          // Fetch from config if not provided
          const sedaConfig = getSedaConfig(hre.network.name);
          coreAddress = sedaConfig.coreAddress;
          console.log(`Using SEDA Core address from config: ${coreAddress}`);
        }
      }

      // Handle Oracle Program ID according to priority
      if (!binaryId) {
        if (hre.network.name === 'hardhat') {
          // Use ZeroHash for local testing
          binaryId = hre.ethers.ZeroHash;
          console.log(`Using ZeroHash as Oracle Program ID for local testing: ${binaryId}`);
        } else {
          // Use the utility function to get and format the ID
          binaryId = getOracleProgramId();
          console.log(`Using Oracle Program ID from environment: ${binaryId}`);
        }
      }

      // Create network key with name and chainId
      const chainId = hre.network.config.chainId || 0;
      const networkKey = `${hre.network.name}-${chainId}`;

      // Set up path for the deployment file
      const deploymentsDir = path.join(__dirname, '../deployments');
      const deploymentFile = path.join(deploymentsDir, 'addresses.json');

      // Read existing deployments or create new object
      let allDeployments: Record<string, DeploymentInfo> = {};
      if (fs.existsSync(deploymentFile)) {
        try {
          allDeployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        } catch (e) {
          throw new Error(`Could not parse existing deployments file: ${e}`);
        }
      }

      // Check if deployment already exists for this network
      if (allDeployments[networkKey] && !force) {
        const shouldOverwrite = await promptForConfirmation(
          `Deployment already exists for network ${networkKey}. Overwrite? (y/n): `,
        );

        if (!shouldOverwrite) {
          console.log('Deployment cancelled. Use --force to skip this prompt.');
          return;
        }
      }

      // Deploy the PriceFeed contract
      console.log('\nDeploying PriceFeed contract...');
      const PriceFeedFactory = await hre.ethers.getContractFactory('PriceFeed');
      const priceFeed = await PriceFeedFactory.deploy(coreAddress, binaryId);

      await priceFeed.waitForDeployment();
      const priceFeedAddress = await priceFeed.getAddress();

      console.log('\nPriceFeed·deployed·successfully:');
      console.log(`- Contract Address: ${priceFeedAddress}`);
      console.log(`- SEDA Core Address: ${coreAddress}`);
      console.log(`- Oracle Program ID: ${binaryId}`);

      // Get current timestamp for deployment tracking
      const timestamp = Math.floor(Date.now() / 1000);

      // Create the deployment info
      const deploymentInfo = {
        contractAddress: priceFeedAddress,
        coreAddress,
        binaryId,
        timestamp,
        deployer: (await hre.ethers.getSigners())[0].address,
      };

      // Create directory if it doesn't exist
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }

      // Update deployments with new deployment info
      allDeployments[networkKey] = deploymentInfo;

      // Write updated deployments to file
      fs.writeFileSync(deploymentFile, JSON.stringify(allDeployments, null, 2));

      console.log(`\nDeployment information saved to ${deploymentFile}`);
      console.log(`Network key: ${networkKey}`);

      // Verify contract if requested and not on local network
      if (verify && hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
        console.log('\nVerifying contract on block explorer...');
        try {
          await hre.run('verify:verify', {
            address: priceFeedAddress,
            constructorArguments: [coreAddress, binaryId],
          });
          console.log('Contract verification successful');
        } catch (_error) {
          console.warn('Contract verification failed');
        }
      } else if (verify) {
        console.log('\nSkipping verification: Not available on local networks');
      }

      return priceFeedAddress;
    } catch (error) {
      console.error('Deployment failed:', error);
      process.exit(1);
    }
  });

async function promptForConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}
