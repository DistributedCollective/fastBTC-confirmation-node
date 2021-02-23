import { bip32, networks, payments } from 'bitcoinjs-lib';
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";


class BitcoinCtrl {
    init() {
        this.isMainNet = conf.network === 'prod';
        this.pubKeys = conf.walletSigs.pubKeys;
        this.cosigners = conf.walletSigs.cosigners;
        this.api = new BitcoinNodeWrapper(conf.node);
        this.network = this.isMainNet ? networks.bitcoin : networks.testnet;
    }

    getDerivedPubKeys(index) {
        let publicKeys = this.pubKeys.map(key => {
            const node = bip32.fromBase58(key, this.network);
            const child = node.derive(0).derive(index);
            return child.publicKey.toString('hex');
        });
        publicKeys.sort();
        publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
        return publicKeys;
    }

    async checkAddress(index, label, createdDate, rescan = false) {
        const publicKeys = this.getDerivedPubKeys(index);


        const payment = payments.p2sh({
            network: this.network,
            redeem: payments.p2ms({
                m: this.cosigners,
                pubkeys: publicKeys,
                network: this.network
            })
        });

        return await this.api.checkImportAddress(payment, label, createdDate, rescan);
    }
}

export default new BitcoinCtrl();
