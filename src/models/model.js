'use strict';

import { debug } from './../logger';
import { DynamoDB } from 'aws-sdk';
import Joi from 'joi';

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};
const db = new DynamoDB.DocumentClient(dynamoConfig);

class Model {

  static save(item) {
    debug('= Model.save', item);
    const itemParams = {
      TableName: this.tableName,
      Item: item,
      ReturnValues: 'ALL_NEW'
    };
    return this._client('put', itemParams);
  }

  static saveAll(items) {
    debug('= Model.saveAll', items);
    const itemsParams = {RequestItems: {}};
    itemsParams.RequestItems[this.tableName] = items.map(item => {
      return {PutRequest: {Item: item}};
    });
    return this._client('batchWrite', itemsParams);
  }

  static get(hash, range, options={}) {
    return new Promise((resolve, reject) => {
      debug('= Model.get', hash, range);
      const params = {
        TableName: this.tableName,
        Key: this._buildKey(hash, range)
      };
      if(options.attributes){
        params.ProjectionExpression = options.attributes.join(',');
      }
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

  static update(params, hash, range) {
    return new Promise((resolve, reject) => {
      debug('= Model.update', hash, range, JSON.stringify(params));
      const dbParams = {
        TableName: this.tableName,
        Key: this._buildKey(hash, range),
        AttributeUpdates: this._buildAttributeUpdates(params),
        ReturnValues: 'ALL_NEW'
      };
      this._client('update', dbParams).then(result => resolve(result.Attributes))
      .catch(err => reject(err));
    });
  }

  static delete(hash, range) {
    return new Promise((resolve, reject) => {
      debug('= Model.delete', hash);
      const params = {
        TableName: this.tableName,
        Key: this._buildKey(hash, range)
      };
      this._client('delete', params).then(() => resolve(true))
      .catch(err => reject(err));
    });
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
            items: result.Items,
            nextPage: this.nextPage(result.LastEvaluatedKey)
          });
        } else {
          resolve({items: result.Items});
        }
      })
      .catch(err => reject(err));
    });
  }

  static countBy(key, value) {
    return new Promise((resolve, reject) => {
      debug('= Model.allBy', key, value);
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: '#hkey = :hvalue',
        ExpressionAttributeNames: {'#hkey': key},
        ExpressionAttributeValues: {':hvalue': value},
        Select: 'COUNT'
      };
      this._client('query', params).then((result) => {
        resolve(result.Count);
      })
      .catch(err => reject(err));
    });
  }

  static increment(attribute, count, hash, range) {
    debug('= Model.increment', hash, range, attribute, count);
    const params = {
      TableName: this.tableName,
      Key: this._buildKey(hash, range),
      AttributeUpdates: {}
    };
    params.AttributeUpdates[attribute] = {
      Action: 'ADD',
      Value: count
    };
    return this._client('update', params);
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

  static get maxRetries() {
    return 10;
  }

  static get retryDelay() {
    return 50;
  }

  static get schema() {
    return null;
  }

  static isValid(object) {
    debug('= Model.isValid');
    return this._validateSchema(this.schema, object);
  }

  static _validateSchema(schema, campaign) {
    if (!this.schema) return true;
    const result = Joi.validate(campaign, schema);
    return !result.error;
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
    for (let key in params) {
      if (key !== this.hashKey && key !== this.rangeKey) {
        attrUpdates[key] = {
          Action: 'PUT',
          Value: params[key]
        };
      }
    }
    return attrUpdates;
  }

  static _client(method, params, retries = 0) {
    return new Promise((resolve, reject) => {
      debug('Model._client', JSON.stringify(params));
      this._db()[method](params, (err, data) => {
        if (err) {
          debug('= Model._client', method, 'Error', err);
          reject(err);
        } else {
          debug('= Model._client', method, 'Success');
          if (data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0 && retries < this.maxRetries) {
            debug('= Model._client', method, 'Some unprocessed items... Retrying', JSON.stringify(data));
            const retryParams = {RequestItems: data.UnprocessedItems};
            const delay = this.retryDelay * Math.pow(2, retries);
            setTimeout(() => {
              resolve(this._client(method, retryParams, retries + 1));
            }, delay);
          } else {
            debug('= Model._client', method, 'resolving', JSON.stringify(data));
            resolve(data);
          }
        }
      });
    });
  }

  static _db() {
    return db;
  }

 }

module.exports.Model = Model;
