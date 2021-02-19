import telegramBot from '../secrets/telegram.js';

export default {
    serverPort: 3000,
    nodeId: 2, //every node gets a unique id
    nodeProvider: 'https://mainnet.sovryn.app/rpc',
    network: "main",
    db: "node_mainnet.db",
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    multisigAddress: "",
    startBlock: 3000000
}