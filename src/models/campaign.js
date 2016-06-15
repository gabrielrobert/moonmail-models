import { debug } from './../logger';
import { Model } from './model';
import Joi from 'joi';
import moment from 'moment';

class Campaign extends Model {

  static get tableName() {
    return process.env.CAMPAIGNS_TABLE;
  }

  static get sentAtIndex() {
    return process.env.SENT_AT_INDEX_NAME;
  }

  static get hashKey() {
    return 'userId';
  }

  static get rangeKey() {
    return 'id';
  }

  static get schema() {
    return Joi.object({
      userId: Joi.string().required(),
      body: Joi.string().required(),
      subject: Joi.string().required(),
      name: Joi.string().required(),
      id: Joi.string().required(),
      senderId: Joi.string(),
      listIds: Joi.array(),
      sentAt: Joi.number(),
      createdAt: Joi.number(),
      status: Joi.string()
    });
  }

  static isValidToBeSent(campaign) {
    debug('= Campaign.isValidToBeSent', campaign);
    const schema = Joi.object({
      userId: Joi.string().required(),
      id: Joi.string().required(),
      body: Joi.string().required(),
      subject: Joi.string().required(),
      listIds: Joi.array().items(Joi.string().required()).required(),
      name: Joi.string().required(),
      senderId: Joi.string(),
      sentAt: Joi.number(),
      createdAt: Joi.number(),
      status: Joi.string()
    });
    return this._validateSchema(schema, campaign);
  }

  static sentLastMonth(userId) {
    return new Promise((resolve, reject) => {
      debug('= Campaign.sentLastMonth', userId);
      const lastMonthTimestamp = moment().subtract(30, 'days').unix();
      const params = {
        TableName: this.tableName,
        IndexName: this.sentAtIndex,
        KeyConditionExpression: 'userId = :userId and sentAt > :lastMonth',
        ExpressionAttributeValues: {':lastMonth': lastMonthTimestamp, ':userId': userId},
        Select: 'COUNT'
      };
      return this._client('query', params).then(result => resolve(result.Count))
          .catch(err => reject(err));
    });
  }
}

module.exports.Campaign = Campaign;
