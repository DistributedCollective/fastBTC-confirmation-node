import telegramBot from '../secrets/telegram.js';
import accounts from "../secrets/accounts";
import node from '../secrets/btcNode';

export default {
    nodeId: 2, //every node gets a unique id
    masterNode: '', // add me
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: node.main,
    network: "main",
    db: "node_mainnet.db",
    multisigAddress: "",
    startBlock: 3000000,
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -0, // add me
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}