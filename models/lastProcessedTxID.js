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

  async checkTable() {
      if (! await this.findOne({ id: 0 })) {
          console.error("The tabel LastProcessedTxID does not exist or does not " +
              "have the marker row, did you run migrations?");
          process.exit(1);
      }
  }
}
