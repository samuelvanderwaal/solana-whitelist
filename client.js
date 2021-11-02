const anchor = require("@project-serum/anchor");
const { Connection, Keypair, PublicKey, SystemProgram } = anchor.web3;
const bs58 = require("bs58");
const fs = require("fs");

const WHITELIST_LEN = 59;

const provider = anchor.Provider.local();
anchor.setProvider(provider);
const key1 = new PublicKey("AVdBTNhDqYgXGaaVkqiaUJ1Yqa61hMiFFaVRtqwzs5GZ");
const key2 = new PublicKey("PanbgtcTiZ2PveV96t2FHSffiLHXXjMuhvoabUUKKm8");
const key3 = new PublicKey("42NevAWA6A8m9prDvZRUYReQmhNC3NtSZQNFUppPJDRB");
let list = [];

async function main() {
    for (let i = 0; i < 10; i++) {
        list.push(key3);
    }
    const connection = new Connection("http://localhost:8899");

    const idl = JSON.parse(
        require("fs").readFileSync("./target/idl/whitelist.json", "utf8")
    );

    const programId = new anchor.web3.PublicKey(
        "G9B3QBo3BJAbn37XmaBNN4ybjLXuiUSRxwgjGdyau85J"
    );

    const program = new anchor.Program(idl, programId);
    const user = provider.wallet.payer;

    const whitelistState = new PublicKey(
        "GoxBArbcnKfBYb8FoLpUNbP4Zo3JpLYh4Eg2uEm1cmCv"
    );
    const whitelistData = new PublicKey(
        "8nnD38Z1eMyLfksYnrdJpDg9pEN3mLjjXhuMKvndPvHL"
    );

    // let tx = await initialize(program, user);

    await addAddresses(program, whitelistState, whitelistData, user, list);

    //   await resetCounter(program, connection, whitelistState, user);

    // await decodeAccount(connection, whitelistData, 1, 32);
}

main().then(() => {
    console.log("Success");
});

async function addAddresses(
    program,
    whitelistState,
    whitelistData,
    user,
    list
) {
    let tx = await program.rpc.addWhitelistAddresses(list, {
        accounts: {
            whitelistState,
            whitelistData,
            authority: user.publicKey,
        },
        signers: [user],
    });
    console.log(tx);
}

async function resetCounter(program, connection, whitelist_storage, user) {
    let tx = await program.rpc.resetWhitelistCounter({
        accounts: {
            whitelist: whitelist_storage,
            authority: user.publicKey,
        },
        signers: [user],
    });
}
async function decodeAccount(connection, account, start, end) {
    let offset = 8;
    let info = await connection.getAccountInfo(account);
    for (let i = start; i < end; i++) {
        let decoded = bs58.encode(
            info.data.slice(offset + i * 32, offset + (i + 1) * 32)
        );
        console.log(decoded);
    }
}
async function initialize(program, user) {
    const whitelistState = anchor.web3.Keypair.generate();
    const whitelistData = anchor.web3.Keypair.generate();

    //   let data = fs.readFileSync("./whitelist_state.json", { encoding: "utf8" });
    //   let secret = JSON.parse(data);
    //   const whitelistState = Keypair.fromSecretKey(Uint8Array.from(secret));
    //   data = fs.readFileSync("./whitelist_state.json", { encoding: "utf8" });
    //   secret = JSON.parse(data);
    //   const whitelistData = Keypair.fromSecretKey(Uint8Array.from(secret));

    const whitelistDataSize = 8 + 32 * WHITELIST_LEN;

    console.log(whitelistState.publicKey.toString());
    console.log(whitelistData.publicKey.toString());

    let tx = await program.rpc.initialize(user.publicKey, {
        accounts: {
            whitelistState: whitelistState.publicKey,
            whitelistData: whitelistData.publicKey,
            user: user.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [whitelistState, whitelistData],
        instructions: [
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: program.provider.wallet.publicKey,
                lamports:
                    await program.provider.connection.getMinimumBalanceForRentExemption(
                        whitelistDataSize
                    ),
                newAccountPubkey: whitelistData.publicKey,
                programId: program.programId,
                space: whitelistDataSize,
            }),
        ],
    });
}

async function update_whitelist(program, whitelist_storage, user, list) {
    let tx = await program.rpc.updateWhitelist(list, {
        accounts: {
            whitelist: whitelist_storage,
            authority: user.publicKey,
        },
        signers: [user],
    });
    console.log(tx);
}
