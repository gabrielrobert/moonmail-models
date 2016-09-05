import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { ScheduledCampaign } from '../src/models/scheduled_campaign';

chai.use(chaiAsPromised);

describe('ScheduledCampaign', () => {
  const tableName = 'ScheduledCampaigns-table';
  const campaignId = 'campaignId';
  const scheduledAt = 12345;
  let tNameStub;
  const recipientHashKey = 'campaignId';
  const recipientRangeKey = 'scheduledAt';

  before(() => {
    sinon.stub(ScheduledCampaign, '_client').resolves(true);
    tNameStub = sinon.stub(ScheduledCampaign, 'tableName', { get: () => tableName});
  });

  describe('#get', () => {
    it('calls the DynamoDB get method with correct params', (done) => {
      ScheduledCampaign.get(campaignId, scheduledAt).then(() => {
        const args = ScheduledCampaign._client.lastCall.args;
        expect(args[0]).to.equal('get');
        expect(args[1]).to.have.deep.property(`Key.${recipientHashKey}`, campaignId);
        expect(args[1]).to.have.deep.property(`Key.${recipientRangeKey}`, scheduledAt);
        expect(args[1]).to.have.property('TableName', tableName);
        done();
      });
    });
  });

  describe('#hashKey', () => {
    it('returns the hash key name', () => {
      expect(ScheduledCampaign.hashKey).to.equal(recipientHashKey);
    });
  });

  describe('#rangeKey', () => {
    it('returns the range key name', () => {
      expect(ScheduledCampaign.rangeKey).to.equal(recipientRangeKey);
    });
  });

  after(() => {
    ScheduledCampaign._client.restore();
    tNameStub.restore();
  });
});
