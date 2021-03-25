/**
 * Database controller
 * Stores user deposits on a given Btc address
 */


const sqlite3 = require('sqlite3').verbose();
const path = require('path');

import Payment from "../models/payment";

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

            await this.paymentRepository.createTable();
        } catch (e) {
            console.log(e);
        }
    }

    async addPaymentTx(txHash, valueBtc, confirmedTime) {
        console.log("Adding payment to db");
        console.log(txHash);
        console.log(valueBtc);
        console.log(confirmedTime);

        try {
            return await this.paymentRepository.insert({
                txHash: txHash,
                valueBtc: valueBtc,
                dateAdded: new Date(Date.now()),
                confirmedTime: isNaN(confirmedTime)? new Date(Date.now()):confirmedTime
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getPayment(txHash) {
        try {
            const res = await this.paymentRepository.findOne({
                txHash: txHash
            });
            console.log(res);
            return res;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
}

export default new DbCtrl();
