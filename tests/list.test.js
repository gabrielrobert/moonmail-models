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

  describe('#updateImportStatus', () => {
    it('updates the import status object attributes', () => {
      List.updateImportStatus(userId, listId, 'some-file.csv', { updatedAt: '9898789798', status: 'FAILED' }).then(() => {
        const args = List._client.lastCall.args;
        expect(args[0]).to.equal('update');
        expect(args[1]).to.have.deep.property(`Key.${listHashKey}`, userId);
        expect(args[1]).to.have.deep.property(`Key.${listRangeKey}`, listId);
        expect(args[1]).to.have.property('TableName', tableName);
        expect(args[1]).to.have.property('UpdateExpression', 'SET #importStatus.#fileName = :newStatus');
        expect(args[1]).to.have.property('ExpressionAttributeNames', {
          '#importStatus': 'importStatus',
          '#fileName': 'some-file.csv'
        });
        expect(args[1].ExpressionAttributeValues).to.deep.equals({ ':newStatus': { updatedAt: '9898789798', status: 'FAILED' } });
        done();
      });
    });
  });

  after(() => {
    List._client.restore();
    tNameStub.restore();
  });
});
