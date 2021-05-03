import BaseModel from "./baseModel";

export default class LastProcessedTxID extends BaseModel {
  constructor(db) {
    const sql = `CREATE TABLE IF NOT EXISTS last_processed_txid (
            id int primary key CHECK (id = 0),
            txId int not null,
            txHash text,
            dateAdded datetime
        )`;

    super(db, 'last_processed_txid', sql);
  }

  async createTable() {
      const lastProcessedTxId = await super.createTable();
      console.log("Created last_processed_txid table", lastProcessedTxId);

      if (! await this.findOne({ id: 0 })) {
          console.log("Added last processed tx id row");
          await this.insert({id: 0, txId: 0});
      }

      return lastProcessedTxId;
  }
}
