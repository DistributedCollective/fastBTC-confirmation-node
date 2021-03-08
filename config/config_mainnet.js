import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.main';
import accounts from "../secrets/accounts";

export default {
    nodeId: 2, //every node gets a unique id
    masterNode: '', // add me
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "main",
    db: "node_mainnet.db",
    multisigAddress: "0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d",
    walletSigs,
    startIndex: 0, //tx-index
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -0, // add me
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}