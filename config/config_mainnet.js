import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.main';
import accounts from "../secrets/accounts";

export default {
    masterNode: 'http://3.131.33.161:3000/',
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "main",
    db: "node_mainnet",
    contractAddress: '0xC9e14126E5796e999890a4344b8e4c99Ac7002A1'.toLowerCase(),
    bscBridgeAddress: '0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581'.toLowerCase(), // RSK network RSK-BSC bridge. TODO: double check
    bscAggregatorAddress: '0xF300e09958cEE25453da4D7405045c43bFec602f'.toLowerCase(),  // BSC network BTCs aggregator. TODO: double check
    multisigAddress: "0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d".toLowerCase(),
    bscPrefix: 'bsc:',
    walletSigs,
    startIndex: 12000, //tx-index
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -1001469142339, 
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}
