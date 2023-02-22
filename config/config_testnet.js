import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.test';
import accounts from "../secrets/accounts";

export default {
    masterNode: 'http://localhost:3007/',
    rskNodeProvider: 'https://testnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "test",
    db: "node_testnet",
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    contractAddress: "0xACBE05e7236F7d073295C99E629620DA58284AaD".toLowerCase(),
    bscBridgeAddress: "0x2b2bcad081fa773dc655361d1bb30577caa556f8".toLowerCase(),
    bscAggregatorAddress: "0x63f9a9145147330dFAdc991CC3821DF23879ae16".toLowerCase(),
    // old: bscAggegatorAddress: "0xc54B47AC178273A42Fb71631d8018aD7EBbec330".toLowerCase(),
    // old old: bscAggregatorAddress: "0xe2C2fbAa4407fa8BB0Dbb7a6a32aD36f8bA484aE".toLowerCase(),
    bscPrefix: 'bsctest:',

    walletSigs,
    startIndex: 195, //multisig tx-index from which the node starts confirming withdraw requests
    account: accounts["test"],
    blockExplorer: "https://explorer.testnet.rsk.co",
    sovrynInternalTelegramId: -523868176,
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
};
