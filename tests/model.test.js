import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const chaiThings = require('chai-things');
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Model } from '../src/models/model';

chai.use(chaiThings);
chai.use(chaiAsPromised);

describe('Model', () => {
  let db;
  const validTable = 'valid-table';
  const retryableTable = 'retriable-table';

  before(() => {
    awsMock.mock('DynamoDB.DocumentClient', 'put', (params, cb) => {
      if (params.hasOwnProperty('TableName')) {
        cb(null, {});
      } else {
        cb('Invalid params');
      }
    });
    awsMock.mock('DynamoDB.DocumentClient', 'batchWrite', (params, cb) => {
      if (params.RequestItems.hasOwnProperty(validTable)) {
        cb(null, {});
      } else if (params.RequestItems.hasOwnProperty(retryableTable)) {
        const result = {UnprocessedItems: {}};
        result.UnprocessedItems[retryableTable] = [{id: 'some-id'}];
        cb(null, result);
      } else {
        cb('Invalid params');
      }
    });
    db = new AWS.DynamoDB.DocumentClient();
    sinon.stub(Model, '_db').returns(db);
  });

  describe('#_client()', () => {
    it('calls the DynamoDB specified method and passes the params', (done) => {
      const method = 'put';
      const params = { TableName: 'my-table', Item: {id: '123'}};
      Model._client(method, params).then(() => {
        const dbMethod = db[method];
        const dbArgs = dbMethod.lastCall.args;
        expect(dbMethod).to.have.been.called;
        expect(dbArgs[0]).to.have.property('TableName');
        done();
      });
    });

    context('withouth TableName', () => {
      it('rejects the promise', (done) => {
        const clientPromise = Model._client('put', {});
        expect(clientPromise).to.be.rejected.and.notify(done);
      });
    });

    let clientSpy = null;
    let retryDelayStub = null;

    context('when there are unprocessed items', () => {
      before(() => {
        clientSpy = sinon.spy(Model, '_client');
        retryDelayStub = sinon.stub(Model, 'retryDelay', { get: () => 1.005});
      });

      it('retries the function up to maxRetries', (done) => {
        const params = {RequestItems: {}};
        params.RequestItems[retryableTable] = {};
        Model._client('batchWrite', params).then((res) => {
          expect(Model._client.callCount).to.equal(Model.maxRetries + 1);
          const secondCallParams = Model._client.secondCall.args[1];
          expect(secondCallParams.RequestItems).to.deep.equal(res.UnprocessedItems);
          done();
        });
      });

      after(() => {
        clientSpy.restore();
        retryDelayStub.restore();
      });
    });

    context('when there aren\'t unprocessed items', () => {
      before(() => {
        clientSpy = sinon.spy(Model, '_client');
      });

      it('retries the function up to maxRetries', (done) => {
        const params = {RequestItems: {}};
        params.RequestItems[validTable] = {};
        Model._client('batchWrite', params).then((res) => {
          expect(Model._client.callCount).to.be.calledOnce;
          expect(res).to.deep.equal({});
          done();
        });
      });

      after(() => {
        clientSpy.restore();
      });
    });
  });

  context('stub client', () => {
    const tableName = 'my-table';
    const hashKey = 'myKey';
    const rangeKey = 'myRange';
    const hashValue = 'some hash value';
    const rangeValue = 'some range value';
    const lastEvaluatedKey = {id: '1234', rangeKey: '654'};
    const nextPage = new Buffer(JSON.stringify(lastEvaluatedKey)).toString('base64');
    const item = {some_key: 'some_value'};
    const options = {attributes: ['some_key']}
    let tNameStub;
    let hashStub;
    let rangeStub;
    let clientStub;

    before(() => {
      clientStub = sinon.stub(Model, '_client');
      clientStub.resolves('ok');
      clientStub.withArgs('query').resolves({Items: [], LastEvaluatedKey: lastEvaluatedKey});
      clientStub.withArgs('get').resolves({Item: item});
      tNameStub = sinon.stub(Model, 'tableName', { get: () => tableName});
      hashStub = sinon.stub(Model, 'hashKey', { get: () => hashKey});
      rangeStub = sinon.stub(Model, 'rangeKey', { get: () => rangeKey});
    });

    describe('#get', () => {
      context('only hash key was provided', () => {
        it('calls the DynamoDB get method with correct params', (done) => {
          Model.get(hashValue).then((result) => {
            const args = Model._client.lastCall.args;
            expect(args[0]).to.equal('get');
            expect(args[1]).to.have.property('TableName', tableName);
            expect(args[1]).to.have.deep.property(`Key.${hashKey}`, hashValue);
            expect(result).to.deep.equal(item);
            done();
          });
        });
      });

      context('range key was provided', () => {
        it('calls the DynamoDB get method with correct params', (done) => {
          Model.get(hashValue, rangeValue).then(() => {
            const args = Model._client.lastCall.args;
            expect(args[0]).to.equal('get');
            expect(args[1]).to.have.property('TableName', tableName);
            expect(args[1]).to.have.deep.property(`Key.${hashKey}`, hashValue);
            expect(args[1]).to.have.deep.property(`Key.${rangeKey}`, rangeValue);
            done();
          });
        });
      });

      context('attributes filter was provided', () => {
        it('calls the DynamoDB get method with correct params', (done) => {
          Model.get(hashValue, rangeValue, options).then(() => {
            const args = Model._client.lastCall.args;
            expect(args[0]).to.equal('get');
            expect(args[1]).to.have.property('TableName', tableName);
            expect(args[1]).to.have.deep.property(`Key.${hashKey}`, hashValue);
            expect(args[1]).to.have.deep.property(`Key.${rangeKey}`, rangeValue);
            expect(args[1]).to.have.property('ProjectionExpression', options.attributes.join(','));
            done();
          });
        });
      });
    });

    describe('#allBy', () => {
      const key = 'key';
      const value = 'value';

      it('calls the DynamoDB query method with correct params', (done) => {
        Model.allBy(key, value).then((result) => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('query');
          expect(args[1]).to.have.property('TableName', tableName);
          expect(args[1]).to.have.property('KeyConditionExpression', '#hkey = :hvalue');
          expect(args[1]).to.have.deep.property('ExpressionAttributeNames.#hkey', key);
          expect(result).to.have.property('items');
          expect(result).to.have.property('nextPage', nextPage);
          done();
        });
      });

      context('when the nexPage param was provided', () => {
        it('includes the ExclusiveStartKey in the query', (done) => {
          Model.allBy(key, value, {nextPage}).then(() => {
            const args = Model._client.lastCall.args;
            expect(args[1].ExclusiveStartKey).to.deep.equal(lastEvaluatedKey);
            done();
          });
        });
      });
    });

    describe('#save', () => {
      it('calls the DynamoDB put method with correct params', (done) => {
        const params = {id: 'key'};
        Model.save(params).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('put');
          expect(args[1]).to.have.property('TableName', tableName);
          expect(args[1]).to.have.property('Item', params);
          done();
        });
      });
    });

    describe('#saveAll', () => {
      it('calls the DynamoDB batchWrite method with correct params', (done) => {
        const items = [{id: 'key'}, {id: 'key2'}];
        Model.saveAll(items).then(() => {
          const args = Model._client.lastCall.args;
          const method = args[0];
          const params = args[1];
          expect(method).to.equal('batchWrite');
          expect(params).to.have.deep.property(`RequestItems.${tableName}`);
          for (let item of params.RequestItems[tableName]) {
            expect(item).to.have.deep.property('PutRequest.Item');
            expect(items).to.include.something.that.deep.equals(item.PutRequest.Item);
          }
          done();
        });
      });
    });

    describe('#update', () => {
      it('calls the DynamoDB update method with correct params', (done) => {
        const params = {att: 'value', att2: 'value 2'};
        Model.update(params, hashValue, rangeValue).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('update');
          expect(args[1]).to.have.property('TableName');
          expect(args[1]).to.have.property('Key');
          expect(args[1].AttributeUpdates).to.deep.equal(Model._buildAttributeUpdates(params));
          done();
        });
      });
    });

    describe('#increment', () => {
      it('calls the DynamoDB update method with correct params', (done) => {
        const count = 2;
        const countAttribute = 'someCount';
        Model.increment(countAttribute, count, hashValue, rangeValue).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('update');
          expect(args[1]).to.have.property('TableName');
          expect(args[1]).to.have.property('Key');
          expect(args[1]).to.have.deep.property(`AttributeUpdates.${countAttribute}.Action`, 'ADD');
          expect(args[1]).to.have.deep.property(`AttributeUpdates.${countAttribute}.Value`, count);
          done();
        });
      });
    });

    describe('#delete', () => {
      it('calls the DynamoDB delete method with correct params', (done) => {
        Model.delete(hashValue, rangeValue).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('delete');
          expect(args[1]).to.have.property('TableName');
          expect(args[1].Key).to.deep.equal(Model._buildKey(hashValue, rangeValue));
          done();
        });
      });
    });

    after(() => {
      Model._client.restore();
      tNameStub.restore();
      hashStub.restore();
      rangeStub.restore();
    });
  });

  describe('#_buildAttributeUpdates()', () => {
    it('returns a correct AttributeUpdates object', () => {
      let params = {someAttribute: 'some value', anotherAttribute: 'another value'};
      params[Model.hashKey] = 'some value';
      params[Model.rangeKey] = 'some value';
      const attributeUpdates = Model._buildAttributeUpdates(params);
      for (let key in params) {
        if (key === Model.hashKey || key === Model.rangeKey) {
          expect(attributeUpdates).not.to.have.property(key);
        } else {
          expect(attributeUpdates).to.have.deep.property(`${key}.Action`, 'PUT');
          expect(attributeUpdates).to.have.deep.property(`${key}.Value`, params[key]);
        }
      }
    });
  });

  after(() => {
    awsMock.restore('DynamoDB.DocumentClient');
  });
});
