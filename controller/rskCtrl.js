/**
 * Confirms rBtc withdrawals on a multisig contract
 */
import Web3 from 'web3';
import telegramBot from '../utils/telegram';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import {Mutex} from 'async-mutex';
import walletManager from './walletCtrl';
import U from '../utils/helper'


class RskCtrl {
    init() {
        this.web3 = new Web3(conf.rskNodeProvider);
        this.mutex = new Mutex();
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        this.lastGasPrice = 0;
        this.lastNonce = undefined;

        walletManager.init(this.web3);
    }

    async confirmWithdrawRequest(txId) {
        console.log("Going to send confirmation for tx %s", txId);

        const release = await this.mutex.acquire();
        console.log("Mutex acquired for sending tx %s", txId);

        let wallet;
        try {
            wallet = await this.getWallet();
        }
        catch (e) {
            console.log("Unable to acquire wallet", e)
            release();
            throw e;
        }

        if (wallet.length === 0) {
            release();
            throw new Error("No wallet to process the payment from");
        }

        const rv = await this.getConfirmations(txId);
        console.log("Confirmations for current transaction: %s", rv);

        let currentConfirmations;
        try {
             currentConfirmations = rv.map(x => x.toLowerCase())
        }
        catch (e) {
            console.log("Got exception trying to map current confirmations", e);
            throw e;
        }

        // If we have already signed, balk out
        if (currentConfirmations.indexOf(wallet.toLowerCase()) !== -1) {
            console.log("txid %s already confirmed by us, %s", txId, wallet);
            return;
        }

        try {
            this.lastNonce = await this.getNonce(wallet);
            this.lastGasPrice = await this.getGasPrice();
            console.log("Send tx with nonce: %s", this.lastNonce);

            const receipt = await this.multisig.methods.confirmTransaction(txId).send({
                from: wallet,
                gas: 1000000,
                gasPrice: this.lastGasPrice,
                nonce: this.lastNonce
            }).on('transactionHash', async (transactionHash) => {
                console.log("got transaction hash %s", transactionHash);
                await U.wasteTime(1);
                release();
            });

            console.log("tx receipt:", receipt);

            if (telegramBot) {
                telegramBot.sendMessage(
                    `Transaction with ID ${txId} confirmed. Check it in: ` +
                    `${conf.blockExplorer}/tx/${receipt.transactionHash}`
                ).catch(e => {
                    console.log("Error sending telegram message: %s", e);
                });
            }
        } catch (e) {
            console.log(`Got ${e} when trying to confirm`);
            throw e;
        } finally {
            release();
            walletManager.decreasePending(wallet);
        }
    }

    async getConfirmationCount(txId) {
        const wallet = await walletManager.getWalletAddress();
        if (wallet.length === 0) {
            return {error: "no wallet available to process the assignment"};
        }

        try {
            return await this.multisig.methods.getConfirmationCount(txId).call({
                from: wallet,
            });
        } catch (err) {
            console.error("Error getConfirmationCount tx " + txId);
            console.error(err);
            return null;
        }
    }

    async getConfirmations(txId) {
        const wallet = await walletManager.getWalletAddress();

        if (wallet.length === 0) {
            return {error: "no wallet available to process the assignment"};
        }

        try {
            return await this.multisig.methods.getConfirmations(txId).call({
                from: wallet,
            });
        } catch (err) {
            console.error("Error getConfirmations tx " + txId);
            console.error(err);
            return null;
        }
    }

    async getCurrentCoSigners() {
        try {
            return await this.multisig.methods.getOwners().call();
        } catch (err) {
            console.error("Error getCurrentCoSigners", err);
            throw err;
        }
    }

    async getRequiredNumberOfCoSigners() {
        try {
            return await this.multisig.methods.required().call();
        } catch (err) {
            console.error("Error getRequiredNumberOfCoSigners", err);
            throw err;
        }
    }

    /**
     * @notice loads a free wallet from the wallet manager
     */
    async getWallet() {
        let wallet = "";
        let timeout = 5 * 60 * 1000;
        try {
            wallet = await walletManager.getFreeWallet(timeout);
        } catch (e) {
            console.error(e);
        }
        return wallet;
    }

    /**
     * The Rsk node does not return a valid response occasionally for a short
     * period of time. That's why the request is repeated 5 times, and, in case
     * it still fails, the last known gas price is returned.
     */
    async getGasPrice() {
        let cnt = 0;

        while (true) {
            try {
                const gasPrice = await this.web3.eth.getGasPrice();
                return Math.round(gasPrice * 1.2); //add security buffer to avoid gasPrice too low error
            } catch (e) {
                console.error("Error retrieving gas price");
                console.error(e);
                cnt++;

                if (cnt === 5) {
                    return this.lastGasPrice;
                }
            }
        }
    }

    /**
     * The Rsk node does not return a valid response occasionally for a short period of time
     * Thats why the request is repeated 5 times and in case it still fails the last nonce +1 is returned
     */
    async getNonce(wallet) {
        for (let cnt = 0; cnt < 5; cnt ++) {
            try {
                const nonce = await this.web3.eth.getTransactionCount(wallet, 'pending');
                if (this.lastNonce != null && nonce !== this.lastNonce + 1) {
                    console.log("nonce %d not expected %d", nonce, this.lastNonce + 1);
                    if (cnt === 4) {
                        console.log("giving up and returning it anyway")
                        return nonce;
                    }

                    await U.wasteTime(0.5 ** 2 ** cnt);
                }
                else {
                    return nonce;
                }
            } catch (e) {
                console.error("Error retrieving transaction count");
                console.error(e);
            }
        }

        const finalNonce = this.lastNonce + 1 || 0;
        console.error("Returning guessed nonce %d", finalNonce);
        return finalNonce;
    }
}

export default new RskCtrl();
