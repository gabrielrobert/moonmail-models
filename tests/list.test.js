import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { List } from '../src/models/list';

chai.use(chaiAsPromised);

describe('List', () => {
  const tableName = 'Lists-table';
  const listId = 'listId';
  const userId = 'thatUserId';
  let tNameStub;
  const listHashKey = 'userId';
  const listRangeKey = 'id';

  before(() => {
    sinon.stub(List, '_client').resolves(true);
    tNameStub = sinon.stub(List, 'tableName', { get: () => tableName });
  });

  describe('#get', () => {
    it('calls the DynamoDB get method with correct params', (done) => {
      List.get(userId, listId).then(() => {
        const args = List._client.lastCall.args;
        expect(args[0]).to.equal('get');
        expect(args[1]).to.have.deep.property(`Key.${listHashKey}`, userId);
        expect(args[1]).to.have.deep.property(`Key.${listRangeKey}`, listId);
        expect(args[1]).to.have.property('TableName', tableName);
        done();
      });
    });
  });

  describe('#hashKey', () => {
    it('returns the hash key name', () => {
      expect(List.hashKey).to.equal(listHashKey);
    });
  });

  describe('#rangeKey', () => {
    it('returns the range key name', () => {
      expect(List.rangeKey).to.equal(listRangeKey);
    });
  });

  describe('#createFileImportStatus', (done) => {
    it('creates the empty import status object for a file', (done) => {
      List.createFileImportStatus(userId, listId, 'some-file.csv', { some: 'data' }).then(() => {
        const args = List._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${listHashKey}`, userId);
        expect(args[1]).to.have.deep.property(`Key.${listRangeKey}`, listId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.property('UpdateExpression', 'SET #importStatus.#file = :newStatus');
        expect(args[1].ExpressionAttributeNames).to.deep.equals({
          '#importStatus': 'importStatus',
          '#file': 'some-file.csv'
        });
        expect(args[1].ExpressionAttributeValues).to.deep.equals({ ':newStatus': { some: 'data' } });
        done();
      });
    });
  });

  describe('#updateImportStatus', () => {
    it('updates the import status object attributes', (done) => {
      List.updateImportStatus(userId, listId, 'some-file.csv', { text: 'failed', dateField: 'finishedAt', dateValue: '9898789798', isImporting: true }).then(() => {
        const args = List._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${listHashKey}`, userId);
        expect(args[1]).to.have.deep.property(`Key.${listRangeKey}`, listId);
        expect(args[1].TableName).to.equals(tableName);
        expect(args[1]).to.have.property('UpdateExpression', 'SET #importStatus.#file.#status = :newStatus, #importStatus.#file.#dateField = :newDate, #importStatus.#file.#importing = :importingValue');
        expect(args[1].ExpressionAttributeNames).to.deep.equals({
          '#importStatus': 'importStatus',
          '#file': 'some-file.csv',
          '#status': 'status',
          '#dateField': 'finishedAt',
          '#importing': 'importing'
        });
        expect(args[1].ExpressionAttributeValues).to.deep.equals({ ':newStatus': 'failed', ':newDate': '9898789798', ':importingValue': true });
        done();
      });
    });
  });

  after(() => {
    List._client.restore();
    tNameStub.restore();
  });
});
