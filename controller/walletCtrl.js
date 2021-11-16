/**
 * Manages the wallets.
 */
import conf from '../config/config';
import U from '../utils/helper';
import {ethers} from 'ethers';

class WalletManager {
    /**
     * initiates the wallet list and imports the private key
     * @param {*} web3 the web3 instance used by zhe rskCtrl
     */
    init(web3) {
        this.wallet = {};

        const pKey = conf.account.pKey || web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
        web3.eth.accounts.wallet.add(pKey);

        if (!pKey || !/^0x/.test(pKey)) {
            console.error("The RSK private key must be defined and start with 0x");
            throw new Error("Invalid RSK private key, must start with 0x");
        }

        this.wallet = {
            address: conf.account.adr,
            pending: 0
        };

        // make signer available but ensure that pKey doesn't leak!
        this.signDigest = (digest) => {
            const signature = (new ethers.utils.SigningKey(pKey)).signDigest(digest);
            return ethers.utils.joinSignature(signature);
        }
    }

    /**
     * returns a wallet with less than 4 pending transactions
     * @param {*} timeout the maximum waiting time in ms
     */
    async getFreeWallet(timeout) {
        const stopAt = Date.now() + timeout;
        while (Date.now() < stopAt) {
            if (this.wallet.pending < 4) {
                this.wallet.pending++;
                return this.wallet.address;
            }
            await U.wasteTime(0.5);
        }
        return "";
    }


    /**
     * decreases the pending tx count for a wallet
     * @param {*} walletAddress
     */
    decreasePending(walletAddress) {
        if (this.wallet.address === walletAddress) {
            this.wallet.pending--;
            return true;
        }

        console.error("could not decrease the pending tx count for non-existing wallet address: " + walletAddress);
        return false;
    }

    /**
     * For read only blockchain calls.
     * @return {*}
     */
    getWalletAddress() {
        return this.wallet.address;
    }

}

export default new WalletManager();
