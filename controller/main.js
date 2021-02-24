/**
 * Main ctrl
 * todo1: check master/slave communication error-handling
 * todo2: check if tx happend and was not processed already (db)
 * todo3: store tx-id in db
 */
import {bip32, networks, payments} from "bitcoinjs-lib";
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import rskCtrl from './rskCtrl';
import conf from '../config/config';
import U from '../utils/helper';



class MainController {
    constructor() {
        this.api = new BitcoinNodeWrapper(conf.btcNodeProvider);
        this.network = networks.bitcoin;
    }

    async start(socket) {
        await rskCtrl.init();
        const p=this;
        this.socket=socket;
        console.log("connect to master")
        socket.on('connect', () => {
            console.log("Connected to master node");

            // a consigner is the slave node watching for withdraw requests that need confirmation
            socket.emit('getCosignerIndexAndDelay', null, (data) => {
                console.log("My index as cosigner is " + data.index);
                console.log("My delay is " + data.delay + " seconds");
                p.pollAndConfirmWithdrawRequests(data.delay);

            });
        });

        socket.on('disconnect', function () {
            console.log("Disconnected from socket")
        });

    }


    /**
  * Create inifinite loop
  * 1. get tx-id#s
  * 2. for tx-id: call isConfirmed on the multisig to check wheter this proposal is still unconfirmed
  * 3. if so: confirmWithdrawRequest
  */
    async pollAndConfirmWithdrawRequests(delay) {
        let from = 0;
        while (true) {
            console.log("Get withdraw requests");
            const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
            console.log("Number of pending transactions", numberOfTransactions);

            const allTransactionsIDs = await rskCtrl.multisig.methods["getTransactionIds"](from, numberOfTransactions, true, true).call();
            console.log("There are a total of " + allTransactionsIDs.length + " withdraw requests transactions")
            
            
            for(const txID of allTransactionsIDs) {
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txID).call();
                if (!isConfirmed) {
                    let txHash
                    
                    const btcAdr = await this.getBtcAdr(txID);
                    if(!this.verifyPaymentAdr(btcAdr)) {
                        console.error("Wrong btc address");
                    }

                    if (btcAdr) txHash = this.verifyPaymentAdr(btcAdr);
                    if(!txHash){
                        console.error("Error or missing payment");
                        continue;
                    }

                    //todo: check if txID was already processed in DB
                    // otherwise:
                    //store txHash+btc address + txID in db

                    await U.wasteTime(delay);
                    await rskCtrl.confirmWithdrawRequest(txID);
                    console.log(isConfirmed + "\n 'from' is now " + txID)
                    from = txID
                }
            }
            await U.wasteTime(5);
        }
    }

    //todo: add err check
    getBtcAdr(txId) {
        const p=this;
        return setTimeout(() => {
            new Promise(resolve=>{
                p.socket.emit("getBtcAdr", txId, (btcAdr)=>{
                    resolve(btcAdr);
                });
            });
        }, 5000)
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

    
    /**
     * 
     * 
     */
    verifyPaymentAdr(btcAdr) {
        for(let i = 0; i < 100000; i++){
            const publicKeys = conf.walletSigs.pubKeys.map(key => {
                const node = bip32.fromBase58(key, network);
                const child = node.derive(0).derive(i);
                return child.publicKey;
            });
    
            const payment = payments.p2wsh({
                network: network,
                redeem: payments.p2ms({
                    m: conf.walletSigs.cosigners,
                    pubkeys: publicKeys,
                    network: network
                })
            });
    
            if(payment.address==btcAdr) return true;
        }
        return false;
    }  
}

export default new MainController();