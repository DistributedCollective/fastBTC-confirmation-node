import telegramBot from '../secrets/telegram.js';
import accounts from "../secrets/accounts";

export default {
    serverPort: 3001,
    nodeId: 2, //every node gets a unique id
    nodeProvider: 'https://testnet.sovryn.app/rpc',
    network: "test",
    db: "node_testnet.db",
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    startBlock: 1000000,
    account: accounts["test"],
    blockExplorer: "https://explorer.testnet.rsk.co",
    sovrynInternalTelegramId: -523868176,
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}