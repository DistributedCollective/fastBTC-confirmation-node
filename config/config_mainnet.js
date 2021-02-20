import telegramBot from '../secrets/telegram.js';

export default {
    serverPort: 3000,
    nodeId: 2, //every node gets a unique id
    nodeProvider: 'https://mainnet.sovryn.app/rpc',
    network: "main",
    db: "node_mainnet.db",
    multisigAddress: "",
    startBlock: 3000000
}