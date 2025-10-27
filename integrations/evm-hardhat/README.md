<p align="center">
  <a href="https://seda.xyz/">
    <img width="90%" alt="seda-protocol" src="https://raw.githubusercontent.com/sedaprotocol/.github/refs/heads/main/images/banner.png">
  </a>
</p>

<h1 align="center">
  SEDA Hardhat Integration
</h1>

A TypeScript-based starter kit for connecting SEDA Oracle Programs to EVM-compatible blockchains using Hardhat. This integration features a **PriceFeed contract** that demonstrates how to create and retrieve data requests from the SEDA network.

> [!IMPORTANT]
> The **PriceFeed contract is an example** designed for educational purposes. It demonstrates basic SEDA integration patterns but should be modified for production use.

## Prerequisites

Before using this integration, you must:s

1. **Deploy an Oracle Program** to the SEDA network (see the [main README](../../README.md))
2. **Get your Oracle Program ID** from the deployment
3. **Set up your environment** with the required variables

## Quick Start

### 1. Install Dependencies

```sh
cd integrations/evm-hardhat
bun install
```

### 2. Environment Setup

Create a `.env` file with the required variables:

```bash
# Required: Your deployed Oracle Program ID
ORACLE_PROGRAM_ID=YOUR_ORACLE_PROGRAM_ID

# Required: Your EVM private key for deployment
EVM_PRIVATE_KEY=YOUR_EVM_PRIVATE_KEY

# Optional: For contract verification
BASE_SEPOLIA_ETHERSCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

> [!CAUTION]
> You must provide a valid EVM private key in your .env file to deploy and interact with contracts. Never share or commit your private key. Use a dedicated testing account with minimal funds.

Alternatively, this project also supports `dotenvx` for environment variable management with built-in secret encryption. See the [dotenvx documentation](https://dotenvx.com) for usage details.

### 3. Deploy the PriceFeed Contract

> [!IMPORTANT]
> You must deploy the PriceFeed contract before you can create data requests. This is a destination contract that interacts with your deployed Oracle Program.

```sh
# Deploy to Base Sepolia
bunx hardhat pricefeed deploy --network baseSepolia --verify

# Deploy with custom parameters
bunx hardhat pricefeed deploy --oracle-program-id YOUR_ORACLE_PROGRAM_ID --core-address YOUR_CORE_ADDRESS --force
```

To deploy to a specific network, use the `--network` flag followed by the network name (e.g. baseSepolia, goerli). You can also add the `--verify` flag to automatically verify the contract's source code on the network's block explorer after deployment.

By default, the deployment uses environment variables defined in your `.env` file, but you can override these with command-line parameters.

> [!NOTE]
> The project includes a `seda.config.ts` file that contains SEDA-specific configurations including pre-configured core addresses for supported networks. You can modify this file to add support for additional networks or customize existing configurations.

#### 3.1. Verify the deployed PriceFeed contract

Note Mario: with the `--verify` on the initial deployment every single one failed to verify. But when I did verification in an isolated manner it succeeded. To discuss further.

```sh
bunx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG_1> <CONSTRUCTOR_ARG_2>
```


### 4. Interact with Your Contract

#### Basic Workflow

**1. Validate Request (Optional):**
```sh
bunx hardhat pricefeed dryrun --network baseSepolia --token evaa-protocol
```

**2. Submit Request:**
```sh
# Simple mode (zero fees)
bunx hardhat pricefeed transmit --network baseSepolia --token evaa-protocol

# Advanced mode (with custom fees)
bunx hardhat pricefeed transmit --network baseSepolia --token bitcoin \
  --request-fee 0.0001 --result-fee 0.0001 --batch-fee 0.0001
```

**3. Check Status:**
```sh
bunx hardhat pricefeed status --network baseSepolia
```

**4. Fetch Result:**
```sh
bunx hardhat pricefeed latest --network baseSepolia
```

#### Available Commands

- `dryrun` - Validate request before submission (no gas cost)
- `transmit` - Submit a data request (simple or advanced mode)
- `status` - Check if result is ready (non-reverting)
- `latest` - Get the price result (reverts if not ready)
- `fullresult` - View complete result details for debugging

## Project Structure

This project follows the structure of a typical Hardhat project:

- **contracts/**: Contains the Solidity contracts including PriceFeed.
- **tasks/**: Hardhat tasks for interacting with the PriceFeed contract.
- **test/**: Test files for the contracts.
- **seda.config.ts**: SEDA network configurations with deployed Core Addresses.

## Understanding the Integration

### Oracle Program vs Destination Contract

- **Oracle Program** (Rust/WASM): Fetches data from external sources and processes it
- **Destination Contract** (Solidity): Requests data from the Oracle Program and uses the results

The PriceFeed contract is a **destination contract** that:
1. Creates data requests on the SEDA network using your Oracle Program
2. Retrieves processed results from the Oracle Program
3. Makes the data available to other smart contracts

### Example Flow

1. **Deploy Oracle Program** → Get `ORACLE_PROGRAM_ID`
2. **Deploy PriceFeed Contract** → Uses the `ORACLE_PROGRAM_ID`
3. **Call `dryrun()`** → Validate request parameters (optional)
4. **Call `transmit()`** → Creates a data request on SEDA network
5. **Call `status()`** → Check if result is ready
6. **Call `latestAnswer()`** → Retrieves the processed result
7. **Call `fullResult()`** → Retrieves the processed results and presents it in full 

## Testing

```sh
# Compile contracts
bun run compile

# Run tests
bun run test
```

## Development

```sh
# Format code
bun run format

# Lint code
bun run lint
```

## Next Steps

For advanced topics, different oracle programs, and customization ideas, see the [main integrations README](../README.md#whats-next).

## Resources

- [SEDA Protocol Documentation](https://docs.seda.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Building Oracle Programs Guide](https://docs.seda.xyz/home/for-developers/building-an-oracle-program)
- [SEDA SDK Documentation](https://github.com/sedaprotocol/seda-sdk)

## License

Contents of this repository are open source under [MIT License](../../LICENSE).
