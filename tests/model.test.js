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
    let tNameStub;

    before(() => {
      sinon.stub(Model, '_client').resolves(true);
      tNameStub = sinon.stub(Model, 'tableName', { get: () => tableName});
    });

    describe('#get', () => {
      it('calls the DynamoDB get method with correct params', (done) => {
        const key = 'key';
        Model.get(key).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('get');
          expect(args[1]).to.have.property('TableName', tableName);
          expect(args[1]).to.have.deep.property('Key.id', key);
          done();
        });
      });
    });

    describe('#allBy', () => {
      it('calls the DynamoDB query method with correct params', (done) => {
        const key = 'key';
        const value = 'value';
        Model.allBy(key).then(() => {
          const args = Model._client.lastCall.args;
          expect(args[0]).to.equal('query');
          expect(args[1]).to.have.property('TableName', tableName);
          expect(args[1]).to.have.property('KeyConditionExpression', '#hkey = :hvalue');
          expect(args[1]).to.have.deep.property('ExpressionAttributeNames.#hkey', key);
          done();
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

    after(() => {
      Model._client.restore();
      tNameStub.restore();
    });
  });

  after(() => {
    awsMock.restore('DynamoDB.DocumentClient');
  });
});
