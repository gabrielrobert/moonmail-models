import { debug } from './../logger';
import { Model } from './model';
import moment from 'moment';
import deepAssign from 'deep-assign';

class ScheduledCampaign extends Model {

  static get tableName() {
    return process.env.SCHEDULED_CAMPAIGNS_TABLE;
  }

  static get hashKey() {
    return 'campaignId';
  }

  static get rangeKey() {
    return 'scheduledAt';
  }
}

module.exports.ScheduledCampaign = ScheduledCampaign;
