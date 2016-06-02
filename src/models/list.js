import { Model } from './model';

class List extends Model {

  static get tableName() {
    return process.env.LISTS_TABLE;
  }

  static get hashKey() {
    return 'userId';
  }

  static get rangeKey() {
    return 'id';
  }
}

module.exports.List = List;
