import BaseModel from "./baseModel";

export default class DepositAddress extends BaseModel {
  constructor(db) {
    super(db, 'deposit_address');
  }
}
