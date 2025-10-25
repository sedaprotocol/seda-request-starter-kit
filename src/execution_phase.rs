use anyhow::Result;
use seda_sdk_rs::{elog, http_fetch, log, Process};
use serde::{Deserialize, Serialize};

// Binance API response structure
#[derive(Serialize, Deserialize)]
struct BinancePriceResponse {
    price: String,
}

// CoinGecko Simple Price API response structure
// Example: {"evaa-protocol":{"usd":11.34}}
#[derive(Serialize, Deserialize)]
struct CoinGeckoSimplePrice {
    usd: f64,
}

/**
 * Executes the data request phase within the SEDA network.
 * 
 * Supported input formats:
 * - "binance:ETHUSDC" or "binance:BTCUSDT" - Fetches from Binance API (no separator needed)
 * - Any other input - Fetches from CoinGecko Simple Price API (e.g., "evaa-protocol", "bitcoin")
 * 
 * Examples:
 * - "binance:ETHUSDC" -> Binance
 * - "evaa-protocol" -> CoinGecko
 * - "bitcoin" -> CoinGecko
 */
pub fn execution_phase() -> Result<()> {
    let dr_inputs_raw = String::from_utf8(Process::get_inputs())?;
    log!("Fetching price for: {}", dr_inputs_raw);

    let price = if let Some(symbol) = dr_inputs_raw.strip_prefix("binance:") {
        fetch_binance_price(symbol)?
    } else {
        fetch_coingecko_price(&dr_inputs_raw)?
    };

    log!("Fetched price: {}", price);

    // Convert to integer (multiply by 1e6 to maintain 6 decimal places precision)
    let result = (price * 1000000f32) as u128;
    log!("Reporting: {}", result);

    Process::success(&result.to_le_bytes());
    Ok(())
}

/**
 * Fetches price from Binance API
 * Input: Trading pair symbol without separator (e.g., "ETHUSDC", "BTCUSDT")
 */
fn fetch_binance_price(symbol: &str) -> Result<f32> {
    let response = http_fetch(
        format!(
            "https://api.binance.com/api/v3/ticker/price?symbol={}",
            symbol.to_uppercase()
        ),
        None,
    );

    if !response.is_ok() {
        elog!(
            "Binance API error: {} - {}",
            response.status,
            String::from_utf8(response.bytes)?
        );
        Process::error("Error fetching from Binance API".as_bytes());
        return Err(anyhow::anyhow!("Binance API request failed"));
    }

    let data = serde_json::from_slice::<BinancePriceResponse>(&response.bytes)?;
    Ok(data.price.parse()?)
}

/**
 * Fetches price from CoinGecko Simple Price API
 * Input: Token ID as listed on CoinGecko (e.g., "evaa-protocol", "bitcoin", "ethereum")
 * 
 * Uses the simple/price endpoint which returns: {"token-id":{"usd":123.45}}
 */
fn fetch_coingecko_price(token_id: &str) -> Result<f32> {
    log!("Fetching CoinGecko price for: {}", token_id);

    let response = http_fetch(
        format!(
            "https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd",
            token_id.to_lowercase()
        ),
        None,
    );

    if !response.is_ok() {
        elog!(
            "CoinGecko API error: {} - {}",
            response.status,
            String::from_utf8(response.bytes.clone())?
        );
        Process::error("Error fetching from CoinGecko API".as_bytes());
        return Err(anyhow::anyhow!("CoinGecko API request failed"));
    }

    // Parse response: {"token-id":{"usd":123.45}}
    let response_json: serde_json::Value = serde_json::from_slice(&response.bytes)?;
    
    // Get the token object
    let token_data = response_json.get(token_id)
        .ok_or_else(|| {
            elog!("Token '{}' not found in CoinGecko response", token_id);
            anyhow::anyhow!("Token not found")
        })?;
    
    // Get the USD price
    let price_data: CoinGeckoSimplePrice = serde_json::from_value(token_data.clone())?;
    
    Ok(price_data.usd as f32)
}
