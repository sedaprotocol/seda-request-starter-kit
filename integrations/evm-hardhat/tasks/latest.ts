import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

/**
 * Task: Fetches the latest answer from the PriceFeed contract.
 * Optional parameter: contract (PriceFeed contract address).
 * If the contract address is not provided, fetches from previous deployments.
 */
priceFeedScope
  .task('latest', 'Calls the latestAnswer function on the PriceFeed contract')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .setAction(async ({ contract }, hre) => {
    try {
      // Fetch the address from previous deployments if not provided
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        console.log('No contract address specified, fetching from previous deployments...');
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
        console.log('Contract found:', priceFeedAddress);
      }

      // Get the PriceFeed contract instance
      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);

      // Call the latestAnswer function on the contract
      console.log(`\nCalling latestAnswer() on PriceFeed at ${priceFeedAddress}`);
      const latestAnswer = await priceFeed.latestAnswer();
      console.log('Latest Answer:', latestAnswer.toString());
      // biome-ignore lint/suspicious/noExplicitAny:
    } catch (error: any) {
      console.error(`An error occurred while fetching the latest answer: ${error.message}`);
    }
  });
