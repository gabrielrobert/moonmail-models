import { debug } from './../logger';
import { Model } from './model';

class Report extends Model {

  static get tableName() {
    return process.env.REPORTS_TABLE;
  }

  static get hashKey() {
    return 'campaignId';
  }

  static incrementBounces(hash, count = 1) {
    debug('= Report.incrementBounces', hash);
    return this.increment('bouncesCount', count, hash);
  }

  static incrementDeliveries(hash, count = 1) {
    debug('= Report.incrementDeliveries', hash);
    return this.increment('deliveriesCount', count, hash);
  }

  static incrementComplaints(hash, count = 1) {
    debug('= Report.incrementComplaints', hash);
    return this.increment('complaintsCount', count, hash);
  }
}

module.exports.Report = Report;
