import { afterEach, describe, it, expect, mock } from "bun:test";
import { file } from "bun";
import { testOracleProgramExecution, testOracleProgramTally } from "@seda-protocol/dev-tools"
import { BigNumber } from 'bignumber.js'

const WASM_PATH = "target/wasm32-wasip1/release-wasm/oracle-program.wasm";

const fetchMock = mock();

afterEach(() => {
  fetchMock.mockRestore();
});

// Helper function to check results with tolerance for f32 precision issues
function expectWithinTolerance(result: BigNumber, expected: BigNumber, tolerancePercent: number = 0.1) {
  const tolerance = expected.multipliedBy(tolerancePercent / 100);
  const diff = result.minus(expected).abs();
  if (!diff.isLessThanOrEqualTo(tolerance)) {
    throw new Error(`Value ${result} is not within ${tolerancePercent}% of ${expected} (diff: ${diff})`);
  }
}

describe("Binance API", () => {
  it("should fetch ETH/USDC price from Binance", async () => {
    fetchMock.mockImplementation((url) => {
      if (url.host === "api.binance.com" && url.searchParams.get("symbol") === "ETHUSDC") {
        return new Response(JSON.stringify({ price: "2452.30" }));
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();
    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("binance:ETHUSDC"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expectWithinTolerance(result, BigNumber('2452300000'));
  });

  it("should fetch BTC/USDT price from Binance", async () => {
    fetchMock.mockImplementation((url) => {
      if (url.host === "api.binance.com" && url.searchParams.get("symbol") === "BTCUSDT") {
        return new Response(JSON.stringify({ price: "42000.50" }));
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();
    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("binance:BTCUSDT"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expectWithinTolerance(result, BigNumber('42000500000'));
  });
});

describe("CoinGecko API", () => {
  it("should fetch EVAA Protocol price", async () => {
    fetchMock.mockImplementation((url) => {
      if (url.host === "api.coingecko.com" && url.pathname.includes("/simple/price")) {
        const ids = url.searchParams.get("ids");
        if (ids === "evaa-protocol") {
          return new Response(JSON.stringify({ "evaa-protocol": { "usd": 11.34 } }));
        }
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();
    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("evaa-protocol"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expectWithinTolerance(result, BigNumber('11340000'));
  });

  it("should fetch Bitcoin price", async () => {
    fetchMock.mockImplementation((url) => {
      if (url.host === "api.coingecko.com" && url.pathname.includes("/simple/price")) {
        const ids = url.searchParams.get("ids");
        if (ids === "bitcoin") {
          return new Response(JSON.stringify({ "bitcoin": { "usd": 42000.00 } }));
        }
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();
    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("bitcoin"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expectWithinTolerance(result, BigNumber('42000000000'));
  });

  it("should fetch Ethereum price", async () => {
    fetchMock.mockImplementation((url) => {
      if (url.host === "api.coingecko.com" && url.pathname.includes("/simple/price")) {
        const ids = url.searchParams.get("ids");
        if (ids === "ethereum") {
          return new Response(JSON.stringify({ "ethereum": { "usd": 2450.75 } }));
        }
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    const oracleProgram = await file(WASM_PATH).arrayBuffer();
    const vmResult = await testOracleProgramExecution(
      Buffer.from(oracleProgram),
      Buffer.from("ethereum"),
      fetchMock
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result.toReversed()).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expectWithinTolerance(result, BigNumber('2450750000'));
  });
});

describe("Tally Phase", () => {
  it('should aggregate multiple results using median', async () => {
    const oracleProgram = await file(WASM_PATH).arrayBuffer();

    // Simulate 3 executors reporting slightly different prices
    const price1 = Buffer.from([0, 33, 43, 146, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const price2 = Buffer.from([0, 33, 43, 146, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const price3 = Buffer.from([0, 33, 43, 146, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const vmResult = await testOracleProgramTally(
      Buffer.from(oracleProgram),
      Buffer.from(''),
      [
        { exitCode: 0, gasUsed: 0, inConsensus: true, result: price1 },
        { exitCode: 0, gasUsed: 0, inConsensus: true, result: price2 },
        { exitCode: 0, gasUsed: 0, inConsensus: true, result: price3 },
      ]
    );

    expect(vmResult.exitCode).toBe(0);
    const hex = Buffer.from(vmResult.result).toString('hex');
    const result = BigNumber(`0x${hex}`);
    expect(result).toEqual(BigNumber('2452300032'));
  });
});
