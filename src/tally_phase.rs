use anyhow::Result;
use seda_sdk_rs::{elog, get_reveals, log, Process};

/**
 * Executes the tally phase within the SEDA network.
 * This phase aggregates the results (e.g., price data) revealed during the execution phase,
 * calculates the median value, and submits it as the final result.
 * Note: The number of reveals depends on the replication factor set in the data request parameters.
 */
pub fn tally_phase() -> Result<()> {
    // Tally inputs can be retrieved from Process.getInputs(), though it is unused in this example.
    // let tally_inputs = Process::get_inputs();

    // Retrieve consensus reveals from the tally phase.
    let reveals = get_reveals()?;
    let mut prices: Vec<u128> = Vec::new();

    // Iterate over each reveal, parse its content as an unsigned integer (u128), and store it in the prices array.
    for reveal in reveals {
        let price_bytes_slice: [u8; 16] = match reveal.body.reveal.try_into() {
            Ok(value) => value,
            Err(_err) => {
                // We should always handle a reveal body with care and not exit/panic when parsing went wrong
                // It's better to skip that reveal
                elog!("Reveal body could not be casted to u128");
                continue;
            }
        };

        let price = u128::from_le_bytes(price_bytes_slice);
        log!("Received price: {}", price);

        prices.push(price);
    }

    if prices.is_empty() {
        // If no valid prices were revealed, report an error indicating no consensus.
        Process::error("No consensus among revealed results".as_bytes());
        return Ok(());
    }

    // If there are valid prices revealed, calculate the median price from price reports.
    let final_price = median(prices);

    // Report the successful result in the tally phase, encoding the result as bytes.
    // Encoding result with big endian to decode from EVM contracts.
    Process::success(&final_price.to_be_bytes());

    Ok(())
}

fn median(mut nums: Vec<u128>) -> u128 {
    nums.sort();
    let middle = nums.len() / 2;

    if nums.len() % 2 == 0 {
        return (nums[middle - 1] + nums[middle]) / 2;
    }

    nums[middle]
}
