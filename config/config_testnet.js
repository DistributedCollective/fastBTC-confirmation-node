import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.test';
import accounts from "../secrets/accounts";

export default {
    nodeId: 2, //every node gets a unique id
    masterNode: 'http://localhost:3007/',
    rskNodeProvider: 'https://testnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "test",
    db: "node_testnet.db",
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    walletSigs,
    startIndex: 160, //tx-index
    account: accounts["test"],
    blockExplorer: "https://explorer.testnet.rsk.co",
    sovrynInternalTelegramId: -523868176,
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}