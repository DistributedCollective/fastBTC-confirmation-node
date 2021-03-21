import BaseModel from "./baseModel";

export default class Payment extends BaseModel {
  constructor(db) {
    const sql = `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txHash text UNIQUE,
            valueBtc INTEGER,
            dateAdded datetime,
            confirmedTime datetime
        )`;

    super(db, 'payments', sql);
  }

  async createTable() {
    try {
      const paymentTb = await super.createTable();

      console.log("Created Payment table", paymentTb);

      return paymentTb;
    } catch (e) {
      console.log('Can not create Payment table', e);
    }
  }
}
