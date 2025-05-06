use anyhow::Result;
use seda_sdk_rs::{elog, http_fetch, log, Process};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct PriceFeedResponse {
    price: String,
}

/**
 * Executes the data request phase within the SEDA network.
 * This phase is responsible for fetching non-deterministic data (e.g., price of an asset pair)
 * from an external source such as a price feed API. The input specifies the asset pair to fetch.
 */
pub fn execution_phase() -> Result<()> {
    // Retrieve the input parameters for the data request (DR).
    // Expected to be in the format "symbolA-symbolB" (e.g., "BTC-USDT").
    let dr_inputs_raw = String::from_utf8(Process::get_inputs())?;

    // Log the asset pair being fetched as part of the Execution Standard Out.
    log!("Fetching price for pair: {}", dr_inputs_raw);

    // Split the input string into symbolA and symbolB.
    // Example: "ETH-USDC" will be split into "ETH" and "USDC".
    let dr_inputs: Vec<&str> = dr_inputs_raw.split("-").collect();
    let symbol_a = dr_inputs.first().expect("format should be tokenA-tokenB");
    let symbol_b = dr_inputs.get(1).expect("format should be tokenA-tokenB");

    let response = http_fetch(
        format!(
            "https://api.binance.com/api/v3/ticker/price?symbol={}{}",
            symbol_a.to_uppercase(),
            symbol_b.to_uppercase()
        ),
        None,
    );

    // Check if the HTTP request was successfully fulfilled.
    if !response.is_ok() {
        // Handle the case where the HTTP request failed or was rejected.
        elog!(
            "HTTP Response was rejected: {} - {}",
            response.status,
            String::from_utf8(response.bytes)?
        );

        // Report the failure to the SEDA network with an error code of 1.
        Process::error("Error while fetching price feed".as_bytes());

        return Ok(());
    }

    // Parse the API response as defined earlier.
    let data = serde_json::from_slice::<PriceFeedResponse>(&response.bytes)?;

    // Convert to integer (and multiply by 1e6 to avoid losing precision).
    let price: f32 = data.price.parse()?;
    log!("Fetched price: {}", price);

    let result = (price * 1000000f32) as u128;
    log!("Reporting: {}", result);

    // Report the successful result back to the SEDA network.
    Process::success(&result.to_le_bytes());

    Ok(())
}
