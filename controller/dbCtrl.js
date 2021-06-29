/**
 * Database controller
 * Stores user deposits on a given Btc address
 */
import LastProcessedTxID from '../models/lastProcessedTxID';
import Payment from "../models/payment";
import DepositAddress from '../models/depositAddress';
import DepositAddressSignature from '../models/depositAddressSignature';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DbCtrl {

    async initDb(dbName) {
        return new Promise(resolve => {
            const file = path.join(__dirname, '../db/' + dbName + ".db");
            this.db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error(err.message, file);
                } else {
                    console.log('Connected to the ' + dbName + ' database.');
                    this.initRepos().catch(console.log).then(() => resolve());
                }
            });
        });
    }

    /**
     * @private
     */
    async initRepos() {
        try {
            this.paymentRepository = new Payment(this.db);
            await this.paymentRepository.checkTable();

            this.lastProcessedTxID = new LastProcessedTxID(this.db);
            await this.lastProcessedTxID.checkTable();

            this.depositAddress = new DepositAddress(this.db);
            await this.depositAddress.checkTable();

            this.depositAddressSignature = new DepositAddressSignature(this.db);
            await this.depositAddressSignature.checkTable();
        } catch (e) {
            console.log(e);
        }
    }

    async addPaymentTx(txHash, vout, valueBtc, confirmedTime, txID) {
        try {
            return await this.paymentRepository.insert({
                txHash: txHash,
                vout: vout,
                valueBtc: valueBtc,
                dateAdded: new Date(),
                txId: txID,
                confirmedTime: isNaN(confirmedTime)? new Date(Date.now()): confirmedTime
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getPayment(txHash, vout) {
        try {
            return await this.paymentRepository.findOne({
                txHash: txHash,
                vout: vout
            });
        } catch (e) {
            return null;
        }
    }

    async getDepositAddressInfo(btcAddress) {
        return await this.depositAddress.findOne({
            btc_deposit_address: btcAddress
        });
    }

    async insertDepositAddressMapping(btcAddress, rskAddress) {
        return await this.depositAddress.insert({
            btc_deposit_address: btcAddress,
            rsk_address: rskAddress,
            created: new Date(),
        });
    }

    async insertOrUpdateAddressMappingSignature(dbMapping, signer, signature) {
        return await this.depositAddressSignature.insertOrReplace({
            deposit_address_id: dbMapping.id,
            signer: signer,
            signature: signature,
            created: new Date()
        });
    }
}

export default new DbCtrl();
