/**
 * Main ctrl
 */

import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import rskCtrl from './rskCtrl';
import config from '../config/config';
import U from '../utils/helper';


class MainController {
    constructor() {
        this.api = new BitcoinNodeWrapper(config.btcNodeProvider);
    }

    async start() {
        await rskCtrl.init();
        this.pollAndConfirmWithdrawRequests();
    }


    /**
  * Create inifinite loop
  * 1. get tx-id#s
  * 2. for tx-id: call isConfirmed on the multisig to check wheter this proposal is still unconfirmed
  * 3. if so: confirmWithdrawRequest
  */
    async pollAndConfirmWithdrawRequests() {
        while (true) {
            console.log("Get withdraw requests");
            const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
            console.log("Number of pending transactions", numberOfTransactions);

            const allTransactionsIDs = await rskCtrl.multisig.methods["getTransactionIds"](0, numberOfTransactions, true, true).call();
            console.log("There are a total of " + allTransactionsIDs.length + " withdraw requests transactions")
            await Promise.all(allTransactionsIDs.map(async (txID) => {
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txID).call();
                if (!isConfirmed) await rskCtrl.confirmWithdrawRequest(txID);
                if (!isConfirmed) console.log(isConfirmed)
            }))
            await U.wasteTime(5);
        }
    }




    async verifyDeposit() {
        const txList = await this.api.listReceivedTxsByLabel(adrLabel, 9999);

        // console.log("Address label %s has %s tx", adrLabel, (txList||[]).length);

        for (const tx of (txList || [])) {
            const confirmations = tx && tx.confirmations;

            if (confirmations === 0) {
                await this.addPendingDepositTx({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    label: adrLabel
                });
            } else if (confirmations >= this.thresholdConfirmations) {
                await this.depositTxConfirmed({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    confirmations: confirmations,
                    label: adrLabel
                });
            }
        }
    }
}

export default new MainController();