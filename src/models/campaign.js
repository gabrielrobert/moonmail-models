import { Model } from './model';

class Campaign extends Model {

  static get tableName() {
    return process.env.CAMPAIGNS_TABLE;
  }

  static get hashKey() {
    return 'userId';
  }

  static get rangeKey() {
    return 'id';
  }
}

module.exports.Campaign = Campaign;
