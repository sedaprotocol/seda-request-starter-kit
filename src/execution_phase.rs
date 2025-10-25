use anyhow::Result;
use seda_sdk_rs::{elog, http_fetch, log, Process, HttpFetchOptions};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

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
fn fetch_coingecko_price(token_input: &str) -> Result<f32> {
    // Check if API key is provided (format: "token-id:api-key")
    let (token_id, api_key_opt) = if let Some(colon_pos) = token_input.rfind(':') {
        let token = &token_input[..colon_pos];
        let key = &token_input[colon_pos + 1..];
        (token, Some(key))
    } else {
        (token_input, None)
    };
    
    log!("Fetching CoinGecko price for: {}", token_id);

    // Build URL and headers based on whether we have Pro API key
    let (url, options) = if let Some(api_key) = api_key_opt {
        log!("Using CoinGecko Pro API");
        let url = format!(
            "https://pro-api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd",
            token_id.to_lowercase()
        );
        let mut headers = BTreeMap::new();
        headers.insert("x-cg-pro-api-key".to_string(), api_key.to_string());
        let options = HttpFetchOptions {
            headers,
            ..Default::default()
        };
        (url, Some(options))
    } else {
        log!("Using CoinGecko Free API");
        let url = format!(
            "https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd",
            token_id.to_lowercase()
        );
        (url, None)
    };

    let response = http_fetch(url, options);

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
