import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.main';
import accounts from "../secrets/accounts";

export default {
    nodeId: 2, //every node gets a unique id
    masterNode: 'http://3.131.33.161:3000/',
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "main",
    db: "node_mainnet.db",
    multisigAddress: "0xeb8d632089F84A5A7E09456e4aB063364c5ebc5c",
    walletSigs,
    startIndex: 0, //tx-index
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -1001469142339, 
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}