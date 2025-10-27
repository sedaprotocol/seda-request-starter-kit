import { priceFeedScope } from '.';
import { getDeployedContract } from './utils';

/**
 * Hardhat task to submit a price request to the SEDA network
 *
 * Supports two modes:
 * - Simple mode: transmit(token) with zero fees
 * - Advanced mode: transmit(token, fees...) with custom fees
 *
 * @param contract - Optional PriceFeed contract address
 * @param token - Token ID to request (default: "evaa-protocol")
 * @param requestFee - Optional request fee (triggers advanced mode)
 * @param resultFee - Optional result fee (triggers advanced mode)
 * @param batchFee - Optional batch fee (triggers advanced mode)
 */
priceFeedScope
  .task('transmit', 'Submit a price request to SEDA network')
  .addOptionalParam('contract', 'The PriceFeed contract address')
  .addOptionalParam('token', 'Token ID to request', 'evaa-protocol')
  .addOptionalParam('requestFee', 'Request fee in ETH (enables advanced mode)')
  .addOptionalParam('resultFee', 'Result fee in ETH (enables advanced mode)')
  .addOptionalParam('batchFee', 'Batch fee in ETH (enables advanced mode)')
  .setAction(async ({ contract, token, requestFee, resultFee, batchFee }, hre) => {
    try {
      let priceFeedAddress = contract;
      if (!priceFeedAddress) {
        priceFeedAddress = getDeployedContract(hre.network, 'PriceFeed');
      }

      const priceFeed = await hre.ethers.getContractAt('PriceFeed', priceFeedAddress);
      const useAdvancedMode = requestFee !== undefined || resultFee !== undefined || batchFee !== undefined;

      let receipt: Awaited<ReturnType<typeof priceFeed.transmit.send>> | null = null;

      if (useAdvancedMode) {
        const parsedRequestFee = hre.ethers.parseEther(requestFee || '0');
        const parsedResultFee = hre.ethers.parseEther(resultFee || '0');
        const parsedBatchFee = hre.ethers.parseEther(batchFee || '0');
        const totalValue = parsedRequestFee + parsedResultFee + parsedBatchFee;

        console.log(`\n${'='.repeat(63)}`);
        console.log(`TRANSMIT [ADVANCED] - ${token}`);
        console.log('='.repeat(63));
        console.log(`Request Fee:  ${requestFee || '0'} ETH`);
        console.log(`Result Fee:   ${resultFee || '0'} ETH`);
        console.log(`Batch Fee:    ${batchFee || '0'} ETH`);
        console.log(`Total:        ${hre.ethers.formatEther(totalValue)} ETH`);
        console.log(`${'='.repeat(63)}\n`);

        const tx = await priceFeed['transmit(string,uint256,uint256,uint256)'](
          token,
          parsedRequestFee,
          parsedResultFee,
          parsedBatchFee,
          { value: totalValue },
        );

        receipt = await tx.wait();
      } else {
        console.log(`\n${'='.repeat(63)}`);
        console.log(`TRANSMIT [SIMPLE] - ${token}`);
        console.log('='.repeat(63));
        console.log(`Fees: Zero`);
        console.log(`${'='.repeat(63)}\n`);

        const tx = await priceFeed['transmit(string)'](token);
        receipt = await tx.wait();
      }

      if (!receipt) {
        console.error('Transaction failed - no receipt received\n');
        return;
      }

      console.log('Transaction confirmed\n');

      // Extract request ID from events
      const priceRequestedTopic = hre.ethers.id('PriceRequested(bytes32,string,uint256)');
      const priceRequestedLog = receipt.logs.find((log) => log.topics[0] === priceRequestedTopic);

      if (priceRequestedLog) {
        const requestId = priceRequestedLog.topics[1];
        console.log(`Request ID: ${requestId}`);
        console.log(`Token:      ${token}\n`);
        console.log(`Processing time: ~30-60 seconds`);
        console.log(`Check status: bunx hardhat pricefeed status --network ${hre.network.name}\n`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('\nError:', errorMessage);

      if (errorMessage.includes('InsufficientFees')) {
        console.error('Insufficient fees. Ensure msg.value >= sum of all fees\n');
      } else if (errorMessage.includes('InvalidToken')) {
        console.error('Invalid token. Token ID cannot be empty\n');
      }
    }
  });
