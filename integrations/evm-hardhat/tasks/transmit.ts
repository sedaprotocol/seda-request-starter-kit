import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

// Default fees in ETH
const DEFAULT_FEE = '0.0001';

/**
 * Task: Calls the transmit function on the PriceFeed contract.
 * Optional parameters:
 * - contract: PriceFeed contract address
 * - requestFee: Fee for data request (in ETH)
 * - resultFee: Fee for result processing (in ETH)
 * - batchFee: Fee for batch operations (in ETH)
 *
 * If parameters are not provided, default values are used.
 */
priceFeedScope
  .task('transmit', 'Calls the transmit function on the PriceFeed contract')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .addOptionalParam('requestFee', 'Fee for data request (in ETH)', DEFAULT_FEE)
  .addOptionalParam('resultFee', 'Fee for result processing (in ETH)', DEFAULT_FEE)
  .addOptionalParam('batchFee', 'Fee for batch operations (in ETH)', DEFAULT_FEE)
  .setAction(async ({ contract, requestFee, resultFee, batchFee }, hre) => {
    try {
      // Fetch the address from previous deployments if not provided
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        console.log('No contract address specified, fetching from previous deployments...');
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
        console.log('Contract found:', priceFeedAddress);
      }

      // Parse the fee values
      const parsedRequestFee = hre.ethers.parseEther(requestFee);
      const parsedResultFee = hre.ethers.parseEther(resultFee);
      const parsedBatchFee = hre.ethers.parseEther(batchFee);

      // Calculate total value for the transaction
      const totalValue = parsedRequestFee + parsedResultFee + parsedBatchFee;

      // Get the PriceFeed contract instance
      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);

      // Call the transmit function
      console.log(`\nCalling transmit() on PriceFeed at ${priceFeedAddress}...\n`);
      console.log(`Fees (ETH):
- Request Fee: ${requestFee}
- Result Fee: ${resultFee}
- Batch Fee: ${batchFee}
- Total: ${hre.ethers.formatEther(totalValue)}\n`);

      const tx = await priceFeed.transmit(parsedRequestFee, parsedResultFee, parsedBatchFee, { value: totalValue });

      // Wait for the transaction
      await tx.wait();
      console.log('Transmit executed successfully.');
    } catch (error) {
      console.error('An error occurred during the transmit function:', error);
    }
  });
