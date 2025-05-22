<p align="center">
  <a href="https://seda.xyz/">
    <img width="90%" alt="seda-protocol" src="https://raw.githubusercontent.com/sedaprotocol/.github/refs/heads/main/images/banner.png">
  </a>
</p>

<h1 align="center">
  SEDA Hardhat Integration
</h1>

This integration is built on a minimal Hardhat boilerplate, focusing on simplicity to showcase how to interact with the SEDA network. It features a sample consumer contract (PriceFeed) that interacts with the SEDA protocol through a Prover Contract, demonstrating how to create and retrieve data requests on the network.

## Getting Started

Navigate to the `evm-hardhat` directory and install the dependencies:

```sh
cd integrations/evm-hardhat
bun install
```

### Project Structure

This project follows the structure of a typical Hardhat project:

- **contracts/**: Contains the Solidity contracts including PriceFeed.
- **tasks/**: Hardhat tasks for interacting with the PriceFeed contract.
- **test/**: Test files for the contracts.

## Environment Variables

Configure the .env file with the necessary variables. Here is an example .env file:

```
ORACLE_PROGRAM_ID=YOUR_ORACLE_PROGRAM_ID
EVM_PRIVATE_KEY=YOUR_EVM_PRIVATE_KEY
BASE_SEPOLIA_ETHERSCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

> [!CAUTION]
> You must provide a valid EVM private key in your .env file to deploy and interact with contracts. Never share or commit your private key. Use a dedicated testing account with minimal funds.

## Compiling and Testing the Contracts

Compile your contracts and run tests to ensure everything works correctly:

```sh
bun run compile
bun run test
```

## Deploying the Contracts

For your pricefeed you'll first need to build and deploy an Oracle Program to the SEDA network. In the root of this repository you'll find and example and the tools to create and deploy your own Oracle Programs. After deployment, you'll receive an ID that identifies your program on the network. This ID should be set in your `.env` file as `ORACLE_PROGRAM_ID`.

Deploy the `PriceFeed` contract using dedicated Hardhat tasks:

```sh
bunx hardhat pricefeed deploy --network baseSepolia --verify
```

To deploy to a specific network, use the `--network` flag followed by the network name (e.g. baseSepolia, goerli). You can also add the `--verify` flag to automatically verify the contract's source code on the network's block explorer after deployment.

By default, the deployment uses environment variables defined in your `.env` file, but you can override these with command-line parameters:

```sh
bunx hardhat pricefeed deploy --oracle-program-id YOUR_ORACLE_PROGRAM_ID --core-address YOUR_CORE_ADDRESS --force
```

> [!NOTE]
> The project includes a `seda.config.ts` file that contains SEDA-specific configurations including pre-configured core addresses for supported networks. You can modify this file to add support for additional networks or customize existing configurations.

## Interacting with Deployed Contracts

Use Hardhat tasks specifically designed for interacting with the PriceFeed contract.

**Transmit a Data Request**: Calls the transmit function on PriceFeed to trigger a data request post on the SEDA network.

```sh
bunx hardhat pricefeed transmit --network baseSepolia
```

**Fetch Latest Answer**: Calls the latestAnswer function on PriceFeed to get the result of the data request.

```sh
bunx hardhat pricefeed latest --network baseSepolia
```

## Additional Resources

- [**SEDA Protocol Documentation**](https://docs.seda.xyz): Learn more about how to build on the SEDA network and interact with data requests.
- [**Hardhat Documentation**](https://hardhat.org/docs): Understand how to use Hardhat for developing, deploying, and testing your contracts.

## License

Contents of this repository are open source under [MIT License](../../LICENSE).
