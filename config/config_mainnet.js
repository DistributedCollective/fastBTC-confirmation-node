import telegramBot from '../secrets/telegram.js';
import accounts from "../secrets/accounts";

export default {
    serverPort: 3000,
    nodeId: 2, //every node gets a unique id
    nodeProvider: 'https://mainnet.sovryn.app/rpc',
    masterNode: '', // add me
    network: "main",
    db: "node_mainnet.db",
    multisigAddress: "",
    startBlock: 3000000,
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -0, // add me
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}