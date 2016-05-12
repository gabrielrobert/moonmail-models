'use strict';

import { debug } from './../logger';
import { DynamoDB } from 'aws-sdk';

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};
const db = new DynamoDB.DocumentClient(dynamoConfig);

class Model {

  static save(params) {
    debug('= Model.save', params);
    const itemParams = {
      TableName: this.tableName,
      Item: params
    };
    return this._client('put', itemParams);
  }

  static get(key, range) {
    debug('= Model.get', key);
    const params = {
      TableName: this.tableName,
      Key: {}
    };
    params.Key[this.hashKey] = key;
    if (range) {
      params.Key[this.rangeKey] = range;
    }
    return this._client('get', params);
  }

  static allBy(key, value) {
    debug('= Model.allBy', key, value);
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: '#hkey = :hvalue',
      ExpressionAttributeNames: {'#hkey': key},
      ExpressionAttributeValues: {':hvalue': value}
    };
    return this._client('query', params);
  }

  static get tableName() {
    return null;
  }

  static get hashKey() {
    return 'id';
  }

  static get rangeKey() {
    return null;
  }

  static _client(method, params) {
    return new Promise((resolve, reject) => {
      debug('Model._client', JSON.stringify(params));
      this._db()[method](params, (err, data) => {
        if (err) {
          debug('= Model._client', method, 'Error', err);
          reject(err);
        } else {
          debug('= Model._client', method, 'Success');
          resolve(data);
        }
      });
    });
  }

  static _db() {
    return db;
  }

 }

module.exports.Model = Model;
