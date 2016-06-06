import { debug } from './../logger';
import { Model } from './model';
import Joi from 'joi';

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

  static isValid(campaign) {
    debug('= Campaign.isValid', campaign);
    const schema = Joi.object({
      userId: Joi.string().required(),
      body: Joi.string().required(),
      subject: Joi.string().required()
    });
    return this._validate(schema, campaign);
  }

  static isValidToBeSent(campaign) {
    debug('= Campaign.isValidToBeSent', campaign);
    const schema = Joi.object({
      userId: Joi.string().required(),
      body: Joi.string().required(),
      subject: Joi.string().required(),
      listIds: Joi.array().items(Joi.string().required()).required(),
      senderId: Joi.string().required()
    });
    return this._validate(schema, campaign);
  }

  static _validate(schema, campaign) {
    const result = Joi.validate(campaign, schema);
    return !result.error;
  }
}

module.exports.Campaign = Campaign;
