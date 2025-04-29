import { PostDataRequestInput, Signer, buildSigningConfig, postAndAwaitDataRequest } from '@seda-protocol/dev-tools';

async function main() {
    if (!process.env.ORACLE_PROGRAM_ID) {
        throw new Error('Please set the ORACLE_PROGRAM_ID in your env file');
    }

    // Takes the mnemonic from the .env file (SEDA_MNEMONIC and SEDA_RPC_ENDPOINT)
    const signingConfig = buildSigningConfig({});
    const signer = await Signer.fromPartial(signingConfig);

    console.log('Posting and waiting for a result, this may take a lil while..');

    const dataRequestInput: PostDataRequestInput = {
        consensusOptions: {
            method: 'none'
        },
        execProgramId: process.env.ORACLE_PROGRAM_ID,
        execInputs: Buffer.from('eth-usdc'),
        tallyInputs: Buffer.from([]),
        memo: Buffer.from(new Date().toISOString()),
    };

    const result = await postAndAwaitDataRequest(signer, dataRequestInput, {});

    console.table({
        ...result,
        requestBlockHeight: result.drBlockHeight.toString(),
        resultBlockHeight: result.blockHeight.toString(),
        blockTimestamp: result.blockTimestamp ? result.blockTimestamp.toISOString() : ''
    });
}

main();