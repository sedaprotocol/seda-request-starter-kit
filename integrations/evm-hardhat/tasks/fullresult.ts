import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

/**
 * Hardhat task to retrieve complete result details for debugging
 * 
 * Displays all fields from the SEDA Result struct including consensus,
 * exit code, gas usage, timestamps, and raw result data.
 * 
 * @param contract - Optional PriceFeed contract address
 */
priceFeedScope
  .task('fullresult', 'Get complete result details (debugging)')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .setAction(async ({ contract }, hre) => {
    try {
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
      }

      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);
      const result = await priceFeed.getFullResult();

      console.log('\n' + '='.repeat(63));
      console.log('FULL RESULT DETAILS');
      console.log('='.repeat(63));

      // Core result
      console.log('\nRESULT:');
      console.log(`  Consensus:    ${result.consensus}`);
      console.log(`  Exit Code:    ${result.exitCode}`);
      console.log(`  Raw (hex):    ${hre.ethers.hexlify(result.result)}`);
      
      // Parse price if available
      if (result.result.length >= 16) {
        const resultBytes = hre.ethers.hexlify(result.result);
        const priceHex = resultBytes.slice(0, 34); // 0x + 32 hex chars (16 bytes)
        const price = BigInt(priceHex);
        const formatted = await priceFeed.formatPrice(price);
        console.log(`  Price:        ${formatted}`);
        console.log(`  Raw Value:    ${price.toString()}`);
      }

      // Execution details
      console.log('\nEXECUTION:');
      console.log(`  DR ID:        ${result.drId}`);
      console.log(`  Gas Used:     ${result.gasUsed.toString()}`);
      console.log(`  Version:      ${result.version}`);

      // Blockchain data
      console.log('\nBLOCKCHAIN:');
      console.log(`  Height:       ${result.blockHeight.toString()}`);
      console.log(`  Timestamp:    ${result.blockTimestamp.toString()}`);
      const date = new Date(Number(result.blockTimestamp) * 1000);
      console.log(`  Time:         ${date.toISOString()}`);

      // Additional metadata
      console.log('\nMETADATA:');
      console.log(`  Payback:      ${hre.ethers.hexlify(result.paybackAddress)}`);
      console.log(`  Payload:      ${hre.ethers.hexlify(result.sedaPayload)}`);

      console.log('\n' + '='.repeat(63));

      // Status interpretation
      if (result.consensus && result.exitCode === 0) {
        console.log('Status: SUCCESS - Oracle executed and reached consensus');
      } else if (!result.consensus) {
        console.log('Status: NO CONSENSUS - Executors did not agree');
      } else {
        console.log(`Status: ERROR - Exit code ${result.exitCode}`);
      }

      console.log('='.repeat(63) + '\n');

    } catch (error: any) {
      console.error('\nError:', error.message || error);
      
      if (error.message?.includes('RequestNotTransmitted')) {
        console.error('No request submitted. Use: bunx hardhat pricefeed transmit\n');
      } else if (error.message?.includes('ResultNotFound')) {
        console.error('Result not available yet. Check: bunx hardhat pricefeed status\n');
      }
    }
  });


