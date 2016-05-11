
import * as chai from 'chai';
const expect = chai.expect;
import { Model } from '../lib/models/model';
const awsMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
import * as sinon from 'sinon';
// import * as sinonAsPromised from 'sinon-as-promised';
const chaiAsPromised = require('chai-as-promised');
// const chaiThings = require('chai-things');

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

  after(() => {
    awsMock.restore('DynamoDB.DocumentClient');
  });
});
