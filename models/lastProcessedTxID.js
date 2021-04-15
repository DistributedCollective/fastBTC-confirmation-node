import BaseModel from "./baseModel";

export default class LastProcessedTxID extends BaseModel {
  constructor(db) {
    const sql = `CREATE TABLE IF NOT EXISTS last_processed_txid (
            id int primary key CHECK (id = 0),
            txId int not null,
            txHash text,
            dateAdded datetime
        )`;

    super(db, 'payments', sql);
  }

  async createTable() {
      const lastProcessedTxId = await super.createTable();
      console.log("Created LastProcessedTxId table", lastProcessedTxId);

      try {
          await this.findOne({ id: 0 });
      }
      catch (e) {
          await this.insert({id: 0, txId: 0});
      }

      return lastProcessedTxId;
  }
}
