import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Report } from '../src/models/report';

chai.use(chaiAsPromised);

describe('Report', () => {
  const tableName = 'Reports-table';
  const campaignId = 'campaignId';
  let tNameStub;
  const reportHashKey = 'campaignId';

  before(() => {
    sinon.stub(Report, '_client').resolves(true);
    tNameStub = sinon.stub(Report, 'tableName', { get: () => tableName});
  });

  describe('#get', () => {
    it('calls the DynamoDB get method with correct params', (done) => {
      Report.get(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('get');
        expect(args[1]).to.have.deep.property(`Key.${reportHashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        done();
      });
    });
  });

  describe('#hashKey', () => {
    it('returns the hash key name', () => {
      expect(Report.hashKey).to.equal(reportHashKey);
    });
  });

  describe('#rangeKey', () => {
    it('returns the range key name', () => {
      expect(Report.rangeKey).to.be.null;
    });
  });

  describe('#incrementBounces', () => {
    it('calls the DynamoDB update method with correct params', (done) => {
      Report.incrementBounces(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${Report.hashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('AttributeUpdates.bouncesCount.Action', 'ADD');
        expect(args[1]).to.have.deep.property('AttributeUpdates.bouncesCount.Value', 1);
        done();
      });
    });
  });

  describe('#incrementDeliveries', () => {
    it('calls the DynamoDB update method with correct params', (done) => {
      Report.incrementDeliveries(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${Report.hashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('AttributeUpdates.deliveriesCount.Action', 'ADD');
        expect(args[1]).to.have.deep.property('AttributeUpdates.deliveriesCount.Value', 1);
        done();
      });
    });
  });

  describe('#incrementComplaints', () => {
    it('calls the DynamoDB update method with correct params', (done) => {
      Report.incrementComplaints(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${Report.hashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('AttributeUpdates.complaintsCount.Action', 'ADD');
        expect(args[1]).to.have.deep.property('AttributeUpdates.complaintsCount.Value', 1);
        done();
      });
    });
  });

  describe('#incrementOpens', () => {
    it('calls the DynamoDB update method with correct params', (done) => {
      Report.incrementOpens(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${Report.hashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('AttributeUpdates.opensCount.Action', 'ADD');
        expect(args[1]).to.have.deep.property('AttributeUpdates.opensCount.Value', 1);
        done();
      });
    });
  });

  describe('#incrementClicks', () => {
    it('calls the DynamoDB update method with correct params', (done) => {
      Report.incrementClicks(campaignId).then(() => {
        const args = Report._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${Report.hashKey}`, campaignId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.deep.property('AttributeUpdates.clicksCount.Action', 'ADD');
        expect(args[1]).to.have.deep.property('AttributeUpdates.clicksCount.Value', 1);
        done();
      });
    });
  });

  after(() => {
    Report._client.restore();
    tNameStub.restore();
  });
});
