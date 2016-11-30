import deepAssign from 'deep-assign';
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

  static get emailIndex() {
    return process.env.EMAIL_INDEX_NAME;
  }

  static get statusIndex() {
    return process.env.RECIPIENT_STATUS_INDEX_NAME;
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

  static emailBeginsWith(listId, email, options = {}) {
    const indexOptions = {
      indexName: this.emailIndex,
      range: {bw: {email}}
    };
    const dbOptions = Object.assign({}, indexOptions, options);
    return this.allBy(this.hashKey, listId, dbOptions);
  }

  static allByStatus(listId, status, options = {}) {
    const indexOptions = {
      indexName: this.statusIndex,
      range: {eq: {status}}
    };
    const dbOptions = Object.assign({}, indexOptions, options);
    return this.allBy(this.hashKey, listId, dbOptions);
  }
}

module.exports.Recipient = Recipient;
