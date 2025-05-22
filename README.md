<p align="center">
  <a href="https://seda.xyz/">
    <img width="90%" alt="seda-protocol" src="https://raw.githubusercontent.com/sedaprotocol/.github/refs/heads/main/images/banner.png">
  </a>
</p>

<h1 align="center">
  SEDA Starter Kit
</h1>

This starter kit helps you create Data Requests (also known as Oracle Programs) on the SEDA network using Rust. It showcases a basic project setup and serves as a foundation for building more complex projects.

## Requirements

- **Bun**: Install [Bun](https://bun.sh/) for package management and building.
- **Rust**: Install [Rust](https://rustup.rs/) for development and building.
- **WASM**: Install the [`wasm32-wasip1`](https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip1.html) target with `rustup target add wasm32-wasip1` for WASM compilation.

- Alternatively, use the [devcontainer](https://containers.dev/) for a pre-configured environment.

## Getting Started

A Data Request execution involves two phases executed in a WASM VM:

1. **Execution Phase**: The phase where non-deterministic operations occur. It can access public data via `http_fetch` or `proxy_http_fetch` calls. Multiple executor nodes run this phase and submit their reports to the SEDA network.

2. **Tally Phase**: Aggregates reports from the execution phase using custom logic to determine a final result.

> [!NOTE]
> This starter kit uses the same Oracle Program for both phases, but you can specify different binaries and add branching logic if needed.

### Building

To build the Oracle Program, run the following (builds using the release profile by default):

```sh
bun run build
```

### Local Testing

To test the Oracle Program, this project uses `@seda-protocol/vm` and `@seda-protocol/dev-tools`. These tools help run the Oracle Program in a local WASM VM and test different scenarios.

This project uses Bun's built-in test runner, but other JavaScript/TypeScript testing frameworks should also work.

> [!WARNING]
> The `@seda-protocol/vm` package might not work properly in Node.js. Try setting the environment variable `NODE_OPTIONS=--experimental-vm-modules` before running the test command.

```sh
bun run test
```

## Implement your Oracle Program

Use these key components to create and define your Oracle Program. The starter kit provides a base for building Oracle Programs on the SEDA network:

- **`src/main.rs`**: The entry point that coordinates both the execution and tally phases of your Data Request.

- **`src/execution_phase.rs`**: Manages the fetching and processing of price data from APIs. This phase involves non-deterministic operations as it can access public data via `http_fetch` and `proxy_http_fetch` calls. Multiple Executor Nodes run this phase, each producing a report that is sent to the SEDA network.

- **`src/tally_phase.rs`**: Aggregates results from multiple Executor reports and calculates the final output using consensus data. This phase is deterministic, combining results from Executor Nodes to reach a consensus.

### Utilities and Functions

The following are some of the key utilities and functions from the `seda-sdk` library used in the example provided in this starter kit. These tools help you build and define your Oracle Program. While these are a few important ones, the SDK offers additional utilities to explore:

- **`Process`**: Manages inputs and outputs, allowing interaction with the WASM VM.
- **`http_fetch`**: Fetches data from public APIs.
- **`Bytes`**: Assists in working with byte arrays, useful for encoding and decoding data.

These components and utilities serve as a foundation for developing your Oracle Program logic. For a complete list of utilities and advanced usage, refer to the official documentation.

## Interacting with SEDA Networks

You can upload Oracle Programs and interact with the SEDA network using the CLI tools provided by `@seda-protocol/dev-tools`.

### Uploading an Oracle Program

To upload an Oracle Program binary, run:

```sh
bun run deploy
```

> [!IMPORTANT]  
> This command requires `RPC_SEDA_ENDPOINT` and `MNEMONIC` environment variables.

Alternatively, you can directly use the CLI to upload an Oracle Program and list existing binaries.

List existing Oracle Programs (requires `RPC_SEDA_ENDPOINT` environment variable):

```sh
# With .env file
bunx seda-sdk oracle-program list
# With flag
bunx seda-sdk oracle-program list --rpc https://rpc.devnet.seda.xyz
```

Upload an Oracle Program (requires `RPC_SEDA_ENDPOINT` and `MNEMONIC` environment variables):

```sh
bunx seda-sdk oracle-program upload PATH_TO_BUILD
```

### Submitting a Data Request

`@seda-protocol/dev-tools` exposes functions that make it easy to create scripts that submit Data Requests to the SEDA network and await the result. The `scripts` directory shows an example.

Submitting a Data Request to the SEDA network, run:

```sh
bun run post-dr
```

This will post a transaction and wait till there is an result.

> [!IMPORTANT]  
> Make sure you have the all environment variables set in `.env` file.


Example of an `.env` file:

```sh
# RPC for the SEDA network you want to interact with
SEDA_RPC_ENDPOINT=https://rpc.devnet.seda.xyz

# Your SEDA chain mnemonic, fill this in to upload binaries or interact with data requests directly
SEDA_MNEMONIC=

# Used for posting data request on the seda chain and configuring the consumer contract
# You can get this by running `bunx seda-sdk oracle-program upload PATH_TO_BUILD`
ORACLE_PROGRAM_ID=
```

## Integrations

### EVM (Ethereum Virtual Machine)

This starter kit includes an EVM integration using Hardhat, which allows you to connect your SEDA oracle data requests to EVM-compatible blockchains like Ethereum.

For setup instructions and detailed usage information, see the [EVM Hardhat Integration README](integrations/evm-hardhat/README.md).

## License

Contents of this repository are open source under [MIT License](LICENSE).