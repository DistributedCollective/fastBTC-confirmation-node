import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.main';
import accounts from '../secrets/accounts';
import btcNodes from '../secrets/btcNode';

export default {
    masterNode: 'http://3.131.33.161:3000/',
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: btcNodes['main'],
    network: 'main',
    db: 'node_mainnet',
    contractAddress: '0xC9e14126E5796e999890a4344b8e4c99Ac7002A1'.toLowerCase(),
    multisigAddress: '0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d'.toLowerCase(),
    bscBridgeAddress: '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350'.toLowerCase(),
    bscAggregatorAddress: '0x1dA3D286a3aBeaDb2b7677c99730D725aF58e39D'.toLowerCase(),  // BSC network BTCs aggregator.
    bscPrefix: 'bsc:',
    walletSigs,
    startIndex: 12000, //tx-index
    account: accounts['main'],
    blockExplorer: 'https://explorer.rsk.co',
    sovrynInternalTelegramId: -1001469142339,
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}
