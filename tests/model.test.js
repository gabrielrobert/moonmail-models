import * as chai from 'chai';
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
import * as sinon from 'sinon';
import * as sinonAsPromised from 'sinon-as-promised';
import { Model } from '../src/models/model';

chai.use(chaiAsPromised);

describe('Model', () => {
  let db;

  before(() => {
    awsMock.mock('DynamoDB.DocumentClient', 'put', (params, cb) => {
      if (params.hasOwnProperty('TableName')) {
        cb(null, {});
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
          expect(result).to.have.property('Items');
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
        })
        .catch(err => console.log(err));
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
