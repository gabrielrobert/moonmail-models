import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { SentEmail } from '../src/models/sent-email';

chai.use(chaiAsPromised);

describe('SentEmail', () => {
  const tableName = 'SentEmails-table';
  const messageId = 'some-message-id';
  const recipientId = 'thatUserId';
  const sentEmailHashKey = 'messageId';
  const listId = 'some-list-id';
  const status = 'sent';
  const params = {recipientId, messageId, listId, status}
  let tNameStub;

  before(() => {
    sinon.stub(SentEmail, '_client').resolves(true);
    tNameStub = sinon.stub(SentEmail, 'tableName', { get: () => tableName});
  });

  describe('#hashKey', () => {
    it('returns the hash key name', () => {
      expect(SentEmail.hashKey).to.equal(sentEmailHashKey);
    });
  });

  describe('#rangeKey', () => {
    it('returns the range key name', () => {
      expect(SentEmail.rangeKey).to.be.null;
    });
  });

  after(() => {
    SentEmail._client.restore();
    tNameStub.restore();
  });
});
