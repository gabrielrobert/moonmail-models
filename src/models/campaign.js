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

  static get schema() {
    return Joi.object({
      userId: Joi.string().required(),
      body: Joi.string().required(),
      subject: Joi.string().required(),
      name: Joi.string().required(),
      id: Joi.string().required(),
      senderId: Joi.string(),
      listIds: Joi.array(),
      sentAt: Joi.array(),
      createdAt: Joi.array(),
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
      sentAt: Joi.array(),
      createdAt: Joi.array(),
      status: Joi.string()
    });
    return this._validateSchema(schema, campaign);
  }
}

module.exports.Campaign = Campaign;
