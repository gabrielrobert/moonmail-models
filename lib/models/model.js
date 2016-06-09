'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./../logger');

var _awsSdk = require('aws-sdk');

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};
var db = new _awsSdk.DynamoDB.DocumentClient(dynamoConfig);

var Model = function () {
  function Model() {
    _classCallCheck(this, Model);
  }

  _createClass(Model, null, [{
    key: 'save',
    value: function save(item) {
      (0, _logger.debug)('= Model.save', item);
      var itemParams = {
        TableName: this.tableName,
        Item: item
      };
      return this._client('put', itemParams);
    }
  }, {
    key: 'saveAll',
    value: function saveAll(items) {
      (0, _logger.debug)('= Model.saveAll', items);
      var itemsParams = { RequestItems: {} };
      itemsParams.RequestItems[this.tableName] = items.map(function (item) {
        return { PutRequest: { Item: item } };
      });
      return this._client('batchWrite', itemsParams);
    }
  }, {
    key: 'get',
    value: function get(hash, range) {
      var _this = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.get', hash, range);
        var params = {
          TableName: _this.tableName,
          Key: _this._buildKey(hash, range)
        };
        if (options.attributes) {
          params.ProjectionExpression = options.attributes.join(',');
        }
        _this._client('get', params).then(function (result) {
          if (result.Item) {
            resolve(result.Item);
          } else {
            resolve({});
          }
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'update',
    value: function update(params, hash, range) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.update', hash, range, JSON.stringify(params));
        var dbParams = {
          TableName: _this2.tableName,
          Key: _this2._buildKey(hash, range),
          AttributeUpdates: _this2._buildAttributeUpdates(params),
          ReturnValues: 'ALL_NEW'
        };
        _this2._client('update', dbParams).then(function (result) {
          return resolve(result.Attributes);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(hash, range) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.delete', hash);
        var params = {
          TableName: _this3.tableName,
          Key: _this3._buildKey(hash, range)
        };
        _this3._client('delete', params).then(function () {
          return resolve(true);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'allBy',
    value: function allBy(key, value) {
      var _this4 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.allBy', key, value);
        var params = {
          TableName: _this4.tableName,
          KeyConditionExpression: '#hkey = :hvalue',
          ExpressionAttributeNames: { '#hkey': key },
          ExpressionAttributeValues: { ':hvalue': value }
        };
        if (options.limit) {
          params.Limit = options.limit;
        }
        if (options.nextPage) {
          params.ExclusiveStartKey = _this4.lastEvaluatedKey(options.nextPage);
        }
        _this4._client('query', params).then(function (result) {
          if (result.LastEvaluatedKey) {
            resolve({
              items: result.Items,
              nextPage: _this4.nextPage(result.LastEvaluatedKey)
            });
          } else {
            resolve({ items: result.Items });
          }
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'countBy',
    value: function countBy(key, value) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.allBy', key, value);
        var params = {
          TableName: _this5.tableName,
          KeyConditionExpression: '#hkey = :hvalue',
          ExpressionAttributeNames: { '#hkey': key },
          ExpressionAttributeValues: { ':hvalue': value },
          Select: 'COUNT'
        };
        _this5._client('query', params).then(function (result) {
          resolve(result.Count);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'increment',
    value: function increment(attribute, count, hash, range) {
      (0, _logger.debug)('= Model.increment', hash, range, attribute, count);
      var params = {
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
  }, {
    key: 'nextPage',
    value: function nextPage(lastEvaluatedKey) {
      return new Buffer(JSON.stringify(lastEvaluatedKey)).toString('base64');
    }
  }, {
    key: 'lastEvaluatedKey',
    value: function lastEvaluatedKey(nextPage) {
      return JSON.parse(new Buffer(nextPage, 'base64').toString('utf-8'));
    }
  }, {
    key: 'isValid',
    value: function isValid(object) {
      (0, _logger.debug)('= Model.isValid');
      return this._validateSchema(this.schema, object);
    }
  }, {
    key: '_validateSchema',
    value: function _validateSchema(schema, campaign) {
      if (!this.schema) return true;
      var result = _joi2.default.validate(campaign, schema);
      return !result.error;
    }
  }, {
    key: '_buildKey',
    value: function _buildKey(hash, range) {
      var key = {};
      key[this.hashKey] = hash;
      if (this.rangeKey) {
        key[this.rangeKey] = range;
      }
      return key;
    }
  }, {
    key: '_buildAttributeUpdates',
    value: function _buildAttributeUpdates(params) {
      var attrUpdates = {};
      for (var key in params) {
        if (key !== this.hashKey && key !== this.rangeKey) {
          attrUpdates[key] = {
            Action: 'PUT',
            Value: params[key]
          };
        }
      }
      return attrUpdates;
    }
  }, {
    key: '_client',
    value: function _client(method, params) {
      var _this6 = this;

      var retries = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('Model._client', JSON.stringify(params));
        _this6._db()[method](params, function (err, data) {
          if (err) {
            (0, _logger.debug)('= Model._client', method, 'Error', err);
            reject(err);
          } else {
            (0, _logger.debug)('= Model._client', method, 'Success');
            if (data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0 && retries < _this6.maxRetries) {
              (function () {
                (0, _logger.debug)('= Model._client', method, 'Some unprocessed items... Retrying', JSON.stringify(data));
                var retryParams = { RequestItems: data.UnprocessedItems };
                var delay = _this6.retryDelay * Math.pow(2, retries);
                setTimeout(function () {
                  resolve(_this6._client(method, retryParams, retries + 1));
                }, delay);
              })();
            } else {
              (0, _logger.debug)('= Model._client', method, 'resolving', JSON.stringify(data));
              resolve(data);
            }
          }
        });
      });
    }
  }, {
    key: '_db',
    value: function _db() {
      return db;
    }
  }, {
    key: 'tableName',
    get: function get() {
      return null;
    }
  }, {
    key: 'hashKey',
    get: function get() {
      return 'id';
    }
  }, {
    key: 'rangeKey',
    get: function get() {
      return null;
    }
  }, {
    key: 'maxRetries',
    get: function get() {
      return 10;
    }
  }, {
    key: 'retryDelay',
    get: function get() {
      return 50;
    }
  }, {
    key: 'schema',
    get: function get() {
      return null;
    }
  }]);

  return Model;
}();

module.exports.Model = Model;