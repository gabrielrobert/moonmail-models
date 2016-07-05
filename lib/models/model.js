'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./../logger');

var _awsSdk = require('aws-sdk');

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _base64Url = require('base64-url');

var _base64Url2 = _interopRequireDefault(_base64Url);

var _deepAssign = require('deep-assign');

var _deepAssign2 = _interopRequireDefault(_deepAssign);

var _omitEmpty = require('omit-empty');

var _omitEmpty2 = _interopRequireDefault(_omitEmpty);

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
        Item: item,
        ReturnValues: 'ALL_OLD'
      };
      itemParams.Item.createdAt = (0, _moment2.default)().unix();
      return this._client('put', itemParams);
    }
  }, {
    key: 'saveAll',
    value: function saveAll(items) {
      (0, _logger.debug)('= Model.saveAll', items);
      var itemsParams = { RequestItems: {} };
      itemsParams.RequestItems[this.tableName] = items.map(function (item) {
        return { PutRequest: { Item: (0, _omitEmpty2.default)(item) } };
      });
      return this._client('batchWrite', itemsParams);
    }
  }, {
    key: 'deleteAll',
    value: function deleteAll(keys) {
      var _this = this;

      (0, _logger.debug)('= Model.deleteAll', keys);
      var itemsParams = { RequestItems: {} };
      itemsParams.RequestItems[this.tableName] = keys.map(function (key) {
        return { DeleteRequest: { Key: _this._buildKey(key[0], key[1]) } };
      });
      return this._client('batchWrite', itemsParams);
    }
  }, {
    key: 'get',
    value: function get(hash, range) {
      var _this2 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.get', hash, range);
        var params = {
          TableName: _this2.tableName,
          Key: _this2._buildKey(hash, range)
        };
        var dbOptions = _this2._buildOptions(options);
        Object.assign(params, dbOptions);
        _this2._client('get', params).then(function (result) {
          if (result.Item) {
            resolve(_this2._refineItem(result.Item, options));
          } else {
            resolve({});
          }
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: '_buildOptions',
    value: function _buildOptions(options) {
      (0, _logger.debug)('= Model._buildOptions', JSON.stringify(options));
      var fieldsOptions = this._fieldsOptions(options);
      var pageOptions = this._buildPageOptions(options);
      var limitOptions = this._buildLimitOptions(options, pageOptions);
      var filterOptions = this._filterOptions(options);
      (0, _deepAssign2.default)(fieldsOptions, pageOptions, limitOptions, filterOptions);
      (0, _logger.debug)('= Model._buildOptions fieldsOptions', JSON.stringify(fieldsOptions));
      return fieldsOptions;
    }
  }, {
    key: '_buildLimitOptions',
    value: function _buildLimitOptions(options, params) {
      if (this._isPaginatingBackwards(params) && options.limit) {
        return { Limit: options.limit + 1 };
      }
      if (options.limit) {
        return { Limit: options.limit };
      }
      return {};
    }
  }, {
    key: '_buildPageOptions',
    value: function _buildPageOptions(options) {
      var page = options.page;
      if (page) {
        if (page.charAt(0) === '-') {
          var prevPage = page.substring(1, page.length);
          return {
            ExclusiveStartKey: this.lastEvaluatedKey(prevPage),
            ScanIndexForward: false
          };
        } else {
          return {
            ExclusiveStartKey: this.lastEvaluatedKey(page),
            ScanIndexForward: true
          };
        }
      }
      return {};
    }
  }, {
    key: '_fieldsOptions',
    value: function _fieldsOptions(options) {
      (0, _logger.debug)('= Model._fieldsOptions', JSON.stringify(options));
      var dbOptions = {};
      if (String(options.include_fields) === 'true' && options.fields) {
        var fields = options.fields.split(',');
        dbOptions.ProjectionExpression = fields.map(function (field) {
          return '#' + field;
        }).join(',');
        var fieldsMapping = fields.reduce(function (acumm, attrName) {
          acumm['#' + attrName] = attrName;
          return acumm;
        }, {});
        dbOptions.ExpressionAttributeNames = fieldsMapping;
      }
      return dbOptions;
    }
  }, {
    key: '_filterOptions',
    value: function _filterOptions(options) {
      var _this3 = this;

      (0, _logger.debug)('= Model._filterOptions', JSON.stringify(options));
      var dbOptions = {};
      if (options.filters) {
        (function () {
          var attributeNamesMapping = {};
          var attributeValuesMapping = {};
          var filterExpressions = [];
          Object.keys(options.filters).forEach(function (key) {
            var attrName = '#' + key;
            attributeNamesMapping[attrName] = key;
            var conditions = options.filters[key];
            Object.keys(conditions).forEach(function (operand) {
              var value = conditions[operand];
              var attrValue = ':' + key;
              attributeValuesMapping[attrValue] = value;
              filterExpressions.push(_this3._buildFilter(attrName, attrValue, _this3._filterOperandsMapping[operand]));
            });
          });
          dbOptions.ExpressionAttributeNames = attributeNamesMapping;
          dbOptions.ExpressionAttributeValues = attributeValuesMapping;
          dbOptions.FilterExpression = filterExpressions.join(' AND ');
        })();
      }
      return dbOptions;
    }
  }, {
    key: '_buildFilter',
    value: function _buildFilter(key, value, operand) {
      return [key, operand, value].join(' ');
    }
  }, {
    key: '_refineItems',
    value: function _refineItems(items, options) {
      var _this4 = this;

      (0, _logger.debug)('= Model._refineItems', JSON.stringify(options));
      if (String(options.include_fields) === 'false' && options.fields) {
        return items.map(function (item) {
          return _this4._refineItem(item, options);
        });
      } else {
        return items;
      }
    }
  }, {
    key: '_refineItem',
    value: function _refineItem(item, options) {
      (0, _logger.debug)('= Model._refineItem', JSON.stringify(options));
      var refined = Object.assign({}, item);
      if (String(options.include_fields) === 'false' && options.fields) {
        var fields = options.fields.split(',');
        fields.map(function (field) {
          return delete refined[field];
        });
      }
      return refined;
    }
  }, {
    key: '_buildPaginationKey',
    value: function _buildPaginationKey(result, params) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      (0, _logger.debug)('= Model._buildPaginationKey', JSON.stringify(params));
      var paginationKey = {};
      var items = result.Items.slice();
      if (items && items.length > 0) {
        var nextKey = this._buildNextKey(result, params);
        Object.assign(paginationKey, nextKey);
        if (!this._isFirstPage(result, params, options)) {
          var prevKey = this._buildPrevKey(result, params, options);
          Object.assign(paginationKey, prevKey);
        }
      }
      return paginationKey;
    }
  }, {
    key: '_buildNextKey',
    value: function _buildNextKey(result, params) {
      (0, _logger.debug)('= Model._buildPrevKey');
      var paginationKey = {};
      var items = result.Items.slice();
      if (params.ScanIndexForward) {
        if (result.LastEvaluatedKey) {
          paginationKey.nextPage = this.nextPage(result.LastEvaluatedKey);
        }
      } else {
        items.reverse();
        var pageItem = items[items.length - 1];
        var nextKey = this._buildKey(pageItem[this.hashKey], pageItem[this.rangeKey]);
        paginationKey.nextPage = this.nextPage(nextKey);
      }
      return paginationKey;
    }
  }, {
    key: '_buildPrevKey',
    value: function _buildPrevKey(result, params, options) {
      (0, _logger.debug)('= Model._buildNextKey');
      var paginationKey = {};
      var items = result.Items.slice();
      if (!this._isFirstPage(result, params, options)) {
        if (items.length >= options.limit + 1) {
          items.pop();
        }
        if (!params.ScanIndexForward) {
          items.reverse();
        }
        var pageItem = items[0];
        var prevKey = this._buildKey(pageItem[this.hashKey], pageItem[this.rangeKey]);
        paginationKey.prevPage = this.prevPage(prevKey);
      }
      return paginationKey;
    }
  }, {
    key: '_isFirstPage',
    value: function _isFirstPage(result, params) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!params.ScanIndexForward && result.Items.length < options.limit + 1 || !options.page) {
        return true;
      }
      return false;
    }
  }, {
    key: '_isPaginatingBackwards',
    value: function _isPaginatingBackwards(params) {
      return params.ScanIndexForward === false;
    }
  }, {
    key: '_buildResponse',
    value: function _buildResponse(result, params, options) {
      var items = result.Items.slice();
      var response = {
        items: this._refineItems(items, options)
      };
      //paginating back
      if (items.length >= options.limit + 1) {
        items.pop();
      }
      if (!params.ScanIndexForward) {
        items.reverse();
      }
      var paginationKeys = this._buildPaginationKey(result, params, options);
      (0, _deepAssign2.default)(response, paginationKeys);
      return response;
    }
  }, {
    key: 'update',
    value: function update(params, hash, range) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.update', hash, range, JSON.stringify(params));
        var dbParams = {
          TableName: _this5.tableName,
          Key: _this5._buildKey(hash, range),
          AttributeUpdates: _this5._buildAttributeUpdates(params),
          ReturnValues: 'ALL_NEW'
        };
        _this5._client('update', dbParams).then(function (result) {
          return resolve(result.Attributes);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(hash, range) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.delete', hash);
        var params = {
          TableName: _this6.tableName,
          Key: _this6._buildKey(hash, range)
        };
        _this6._client('delete', params).then(function () {
          return resolve(true);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'allBy',
    value: function allBy(key, value) {
      var _this7 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.allBy', key, value);
        var params = {
          TableName: _this7.tableName,
          KeyConditionExpression: '#hkey = :hvalue',
          ExpressionAttributeNames: { '#hkey': key },
          ExpressionAttributeValues: { ':hvalue': value },
          ScanIndexForward: true
        };
        var dbOptions = _this7._buildOptions(options, params);
        (0, _deepAssign2.default)(params, dbOptions);
        _this7._client('query', params).then(function (result) {
          var response = _this7._buildResponse(result, params, options);
          resolve(response);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'countBy',
    value: function countBy(key, value) {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('= Model.allBy', key, value);
        var params = {
          TableName: _this8.tableName,
          KeyConditionExpression: '#hkey = :hvalue',
          ExpressionAttributeNames: { '#hkey': key },
          ExpressionAttributeValues: { ':hvalue': value },
          Select: 'COUNT'
        };
        _this8._client('query', params).then(function (result) {
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

    // TODO: It could be a good idea to make increment based on this

  }, {
    key: 'incrementAll',
    value: function incrementAll(hash, range, attrValuesObj) {
      (0, _logger.debug)('= Model.incrementAttrs', hash, range, attrValuesObj);
      var params = {
        TableName: this.tableName,
        Key: this._buildKey(hash, range),
        AttributeUpdates: {}
      };
      for (var key in attrValuesObj) {
        params.AttributeUpdates[key] = {
          Action: 'ADD',
          Value: attrValuesObj[key]
        };
      }
      return this._client('update', params);
    }
  }, {
    key: 'prevPage',
    value: function prevPage(key) {
      return '-' + new Buffer(JSON.stringify(key)).toString('base64');
    }
  }, {
    key: 'nextPage',
    value: function nextPage(lastEvaluatedKey) {
      return _base64Url2.default.encode(JSON.stringify(lastEvaluatedKey));
    }
  }, {
    key: 'lastEvaluatedKey',
    value: function lastEvaluatedKey(nextPage) {
      return JSON.parse(_base64Url2.default.decode(nextPage));
    }
  }, {
    key: 'isValid',
    value: function isValid(object) {
      (0, _logger.debug)('= Model.isValid');
      return this._validateSchema(this.schema, object);
    }
  }, {
    key: '_validateSchema',
    value: function _validateSchema(schema, model) {
      if (!this.schema) return true;
      var result = _joi2.default.validate(model, schema);
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
      var _this9 = this;

      var retries = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('Model._client', JSON.stringify(params));
        _this9._db()[method](params, function (err, data) {
          if (err) {
            (0, _logger.debug)('= Model._client', method, 'Error', err);
            reject(err);
          } else {
            (0, _logger.debug)('= Model._client', method, 'Success');
            if (data.UnprocessedItems && Object.keys(data.UnprocessedItems).length > 0 && retries < _this9.maxRetries) {
              (function () {
                (0, _logger.debug)('= Model._client', method, 'Some unprocessed items... Retrying', JSON.stringify(data));
                var retryParams = { RequestItems: data.UnprocessedItems };
                var delay = _this9.retryDelay * Math.pow(2, retries);
                setTimeout(function () {
                  resolve(_this9._client(method, retryParams, retries + 1));
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
    key: '_filterOperandsMapping',
    get: function get() {
      return {
        eq: '=',
        ne: '<>',
        le: '<=',
        lt: '<',
        ge: '>=',
        gt: '>'
      };
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