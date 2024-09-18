import { Tally, Process, Bytes, u128, Console } from "@seda-protocol/as-sdk/assembly";

/**
 * Executes the tally phase within the SEDA network.
 * This phase aggregates the results (e.g., price data) revealed during the execution phase,
 * calculates the median value, and submits it as the final result.
 * Note: The number of reveals depends on the replication factor set in the data request parameters.
 */
export function tallyPhase(): void {
  // Tally inputs can be retrieved from Process.getInputs(), though it is unused in this example.
  // const tallyInputs = Process.getInputs();

  // Retrieve consensus reveals from the tally phase.
  const reveals = Tally.getReveals();
  const prices: u128[] = [];

  const a = Bytes.fromHexString('006f4291000000000000000000000000');
Console.log(a.toU128().toString());

  // Iterate over each reveal, parse its content as an unsigned integer (u64), and store it in the prices array.
  for (let i = 0; i < reveals.length; i++) {
    const price = reveals[i].reveal.toU128();
    prices.push(price);
  }

  if (prices.length > 0) {
    // If there are valid prices revealed, calculate the median price from price reports.
    const finalPrice = median(prices);

    // Report the successful result in the tally phase, encoding the result as bytes.
    Process.success(Bytes.fromNumber(finalPrice));
  } else {
    // If no valid prices were revealed, report an error indicating no consensus.
    Process.error(Bytes.fromUtf8String("No consensus among revealed results"));
  }
}

/**
 * Function to calculate the median of an array of unsigned integers.
 * @param numbers - Array of u64 numbers
 * @returns The median value
 */
function median(numbers: u128[]): u128 {
  const sorted: u128[] = numbers.sort();
  const middle = i32(Math.floor(sorted.length / 2));

  if (sorted.length % 2 === 0) {
    return u128.div(u128.add(sorted[middle - 1], sorted[middle]), u128.from(2));
  }

  return sorted[middle];
}
