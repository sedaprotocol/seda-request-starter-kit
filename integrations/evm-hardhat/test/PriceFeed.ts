import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import MockSedaCore from '@seda-protocol/evm/artifacts/contracts/mocks/MockSedaCore.sol/MockSedaCore.json';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('PriceFeed Contract', () => {
  // Setup the fixture to deploy contracts
  async function deployPriceFeedFixture() {
    const [admin] = await ethers.getSigners();

    // A Data Request WASM binary ID (mock value)
    const oracleProgramId = ethers.ZeroHash;

    // Deploy MockSedaCore
    const SedaCore = await ethers.getContractFactoryFromArtifact(MockSedaCore);

    // Deploy without constructor arguments as the mock doesn't have the expected constructor
    const core = await SedaCore.deploy();

    // Deploy the PriceFeed contract
    const PriceFeed = await ethers.getContractFactory('PriceFeed');
    const priceFeed = await PriceFeed.deploy(core.getAddress(), oracleProgramId);

    return { priceFeed, core, admin };
  }

  /**
   * Test Case 1: No transmission before `latestAnswer`
   * Ensure that calling latestAnswer without transmitting a data request first reverts.
   */
  it('Should revert if data request is not transmitted', async () => {
    const { priceFeed } = await loadFixture(deployPriceFeedFixture);

    // Attempting to call latestAnswer without a transmission should revert
    await expect(priceFeed.latestAnswer()).to.be.revertedWithCustomError(priceFeed, 'RequestNotTransmitted');
  });

  /**
   * Test Case 2: No data result found
   * Ensure that calling latestAnswer after transmission but without setting a data result reverts.
   */
  it('Should revert if data result is not found', async () => {
    const { priceFeed, core } = await loadFixture(deployPriceFeedFixture);

    // Transmit the data request (but no result set)
    await priceFeed.transmit(0, 0, 0);

    // latestAnswer should revert due to no data result being set
    await expect(priceFeed.latestAnswer()).to.be.revertedWithCustomError(core, 'ResultNotFound');
  });

  /**
   * Test Case 3: Return correct `latestAnswer` with consensus (true)
   * Verify that latestAnswer returns the correct value when consensus is reached.
   */
  it('Should return the correct latest answer if consensus is reached', async () => {
    const { priceFeed, core } = await loadFixture(deployPriceFeedFixture);

    // Transmit a data request
    await priceFeed.transmit(0, 0, 0);
    const dataRequestId = await priceFeed.requestId();

    // Set a data result with consensus in the contract
    const resultValue = '0x0000000000000000000000000e9de9b0'; // Mock value (245230000)
    const result = {
      version: '0.0.1',
      drId: dataRequestId,
      consensus: true,
      exitCode: 0,
      result: resultValue,
      blockHeight: 0,
      blockTimestamp: Math.floor(Date.now() / 1000) + 3600,
      gasUsed: 0,
      paybackAddress: ethers.ZeroAddress,
      sedaPayload: ethers.ZeroHash,
    };
    await core.postResult(result, 0, []);

    // latestAnswer should return the expected result when consensus is reached
    const latestAnswer = await priceFeed.latestAnswer();
    expect(latestAnswer).to.equal(245230000);
  });

  /**
   * Test Case 4: Return zero if no consensus reached
   * Ensure that latestAnswer returns 0 when no consensus is reached.
   */
  it('Should return latest answer (zero) if consensus is not reached', async () => {
    const { priceFeed, core } = await loadFixture(deployPriceFeedFixture);

    // Transmit a data request
    await priceFeed.transmit(0, 0, 0);
    const dataRequestId = await priceFeed.requestId();

    // Set a data result without consensus (false)
    const resultValue = new ethers.AbiCoder().encode(['uint128'], [BigInt(100)]); // Mock value of 100
    const result = {
      version: '0.0.1',
      drId: dataRequestId,
      consensus: false,
      exitCode: 0,
      result: resultValue,
      blockHeight: 0,
      blockTimestamp: Math.floor(Date.now() / 1000) + 3600,
      gasUsed: 0,
      paybackAddress: ethers.ZeroAddress,
      sedaPayload: ethers.ZeroHash,
    };
    await core.postResult(result, 0, []);

    // latestAnswer should return 0 since no consensus was reached
    const latestAnswer = await priceFeed.latestAnswer();
    expect(latestAnswer).to.equal(0);
  });

  /**
   * Test Case 5: Successful transmission
   * Ensure that a data request is correctly transmitted and the request ID is valid.
   */
  it('Should successfully transmit a data request and return a valid request ID', async () => {
    const { priceFeed } = await loadFixture(deployPriceFeedFixture);

    // Assert data request id is zero
    let dataRequestId = await priceFeed.requestId();
    expect(dataRequestId).to.be.equal(ethers.ZeroHash);

    // Call the transmit function
    await priceFeed.transmit(0, 0, 0);

    // Check that the data request ID is valid and stored correctly
    dataRequestId = await priceFeed.requestId();
    expect(dataRequestId).to.not.be.equal(ethers.ZeroHash);
  });
});
