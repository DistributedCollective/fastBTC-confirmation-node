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
    walletSigs,
    startIndex: 175, //multisig tx-index from which the node starts confirming withdraw requests 
    account: accounts["test"],
    blockExplorer: "https://explorer.testnet.rsk.co",
    sovrynInternalTelegramId: -523868176,
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}