import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

/**
 * Hardhat task to perform a dry-run simulation of transmit without executing
 *
 * Validates request parameters and estimates costs before spending gas.
 *
 * @param contract - Optional PriceFeed contract address
 * @param token - Token ID to test (default: "evaa-protocol")
 */
priceFeedScope
  .task('dryrun', 'Simulate transmit without executing (pre-flight validation)')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .addOptionalParam('token', 'Token ID to test', 'evaa-protocol')
  .setAction(async ({ contract, token }, hre) => {
    try {
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
      }

      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);
      const [canSubmit, estimatedCost, warnings] = await priceFeed.dryRun(token);

      console.log(`\n${'='.repeat(63)}`);
      console.log('DRY-RUN VALIDATION');
      console.log('='.repeat(63));
      console.log(`\nToken:      ${token}`);
      console.log(`Status:       ${canSubmit ? 'READY' : 'BLOCKED'}`);
      console.log(`Est. Cost:    ${hre.ethers.formatEther(estimatedCost)} ETH`);

      if (warnings.length > 0) {
        console.log(`\nIssues Found:`);
        warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
      }

      console.log(`\n${'='.repeat(63)}`);
      console.log(canSubmit ? 'Ready to proceed' : 'Resolve issues before transmitting');
      console.log(`${'='.repeat(63)}\n`);

      if (canSubmit) {
        console.log(`Next: bunx hardhat pricefeed transmit --network ${hre.network.name} --token ${token}\n`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('\nError:', errorMessage);
      if (errorMessage.includes('dryRun')) {
        console.error('Contract does not support dryRun. Redeploy with latest version.\n');
      }
    }
  });
