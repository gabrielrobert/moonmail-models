import { Model } from './model';

class Recipient extends Model {

  static get tableName() {
    return process.env.RECIPIENTS_TABLE;
  }

  static get hashKey() {
    return 'listId';
  }

  static get rangeKey() {
    return 'id';
  }
}

module.exports.Recipient = Recipient;
