import telegramBot from '../secrets/telegram.js';

export default {
    serverPort: 3000,
    nodeId: 2, //every node gets a unique id
    nodeProvider: 'https://testnet.sovryn.app/rpc',
    network: "test",
    db: "node_testnet.db",
    contractAddress: "0xcC099752238b1932587bf5793Afeb7d80D04F6e1".toLowerCase(),
    multisigAddress: "0x1D67BDA1144CacDbEFF1782f0E5B43D7B50bbFe0".toLowerCase(),
    startBlock: 1000000
}