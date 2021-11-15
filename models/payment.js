import BaseModel from "./baseModel";

export default class Payment extends BaseModel {
    constructor(db) {
        super(db, 'payments');
    }

    async checkTable() {
        try {
            await this.find({}, {limit: 1});
        } catch (e) {
            console.error('The payments table does not exist, have you ' +
                'run the migrations?', e);
            process.exit(1);
        }
    }
}
