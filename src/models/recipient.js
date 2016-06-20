import { Model } from './model';

const statuses = {
  subscribed: 'subscribed',
  awaitingConfirmation: 'awaitingConfirmation',
  unsubscribed: 'unsubscribed',
  bounced: 'bounced',
  complaint: 'complained'
};

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

  static get statuses() {
    return statuses;
  }
}

module.exports.Recipient = Recipient;
