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
    return new Promise((resolve, reject) => {
      debug('= Model.get', key);
      const params = {
        TableName: this.tableName,
        Key: this._buildKey(key, range)
      };
      this._client('get', params).then(result => {
        if (result.Item) {
          resolve(result.Item);
        } else {
          resolve({});
        }
      })
      .catch(err => reject(err));
    });
  }

  static update(params, key, range) {

  }

  static allBy(key, value, options = {}) {
    return new Promise((resolve, reject) => {
      debug('= Model.allBy', key, value);
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: '#hkey = :hvalue',
        ExpressionAttributeNames: {'#hkey': key},
        ExpressionAttributeValues: {':hvalue': value}
      };
      if (options.limit) {
        params.Limit = options.limit;
      }
      if (options.nextPage) {
        params.ExclusiveStartKey = this.lastEvaluatedKey(options.nextPage);
      }
      this._client('query', params).then((result) => {
        if (result.LastEvaluatedKey) {
          resolve({
            Items: result.Items,
            nextPage: this.nextPage(result.LastEvaluatedKey)
          });
        } else {
          resolve({Items: result.Items});
        }
      })
      .catch(err => reject(err));
    });
  }

  static nextPage(lastEvaluatedKey) {
    return new Buffer(JSON.stringify(lastEvaluatedKey)).toString('base64');
  }

  static lastEvaluatedKey(nextPage) {
    return JSON.parse(new Buffer(nextPage, 'base64').toString('utf-8'));
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

  static _buildKey(hash, range) {
    let key = {};
    key[this.hashKey] = hash;
    if (this.rangeKey) {
      key[this.rangeKey] = range;
    }
    return key;
  }

  static _buildAttributeUpdates(params) {
    let attrUpdates = {};
    for (let key in params ) {
      attrUpdates[key] = {
        Action: 'PUT',
        Value: params[key]
      };
    }
    return attrUpdates;
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
