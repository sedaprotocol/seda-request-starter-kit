import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

/**
 * Hardhat task to check if result is ready without reverting
 * 
 * Safe status check that never throws errors. Use this before calling latestAnswer().
 * 
 * @param contract - Optional PriceFeed contract address
 */
priceFeedScope
  .task('status', 'Check result status (non-reverting)')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .setAction(async ({ contract }, hre) => {
    try {
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
      }

      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);
      const [ready, consensus] = await priceFeed.isResultReady();

      console.log('\n' + '='.repeat(63));
      console.log('REQUEST STATUS');
      console.log('='.repeat(63));

      if (ready && consensus) {
        const price = await priceFeed.latestAnswer();
        const formatted = await priceFeed.formatPrice(price);
        
        console.log(`\nStatus:       COMPLETED`);
        console.log(`Consensus:    YES`);
        console.log(`Price:        ${formatted}`);
        console.log(`Raw Value:    ${price.toString()}`);
        
      } else if (ready && !consensus) {
        console.log(`\nStatus:       COMPLETED`);
        console.log(`Consensus:    NO`);
        console.log(`\nExecutors did not reach consensus on the result.`);
        
      } else {
        console.log(`\nStatus:       PENDING`);
        console.log(`\nRequest is being processed by SEDA executors.`);
        console.log(`Typical processing time: 30-60 seconds`);
      }

      console.log('\n' + '='.repeat(63) + '\n');

    } catch (error: any) {
      console.error('\nError:', error.message || error, '\n');
    }
  });


