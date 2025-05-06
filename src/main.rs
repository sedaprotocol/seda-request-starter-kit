use execution_phase::execution_phase;
use seda_sdk_rs::oracle_program;
use tally_phase::tally_phase;

mod execution_phase;
mod tally_phase;

#[oracle_program]
impl PriceFeed {
    fn execute() {
        execution_phase().unwrap();
    }

    fn tally() {
        tally_phase().unwrap();
    }
}
