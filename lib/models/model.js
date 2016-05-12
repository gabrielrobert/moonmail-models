'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./../logger');

var _awsSdk = require('aws-sdk');

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
    value: function save(params) {
      (0, _logger.debug)('= Model.save', params);
      var itemParams = {
        TableName: this.tableName,
        Item: params
      };
      return this._client('put', itemParams);
    }
  }, {
    key: 'get',
    value: function get(key) {
      (0, _logger.debug)('= Model.get', key);
      var params = {
        TableName: this.tableName,
        Key: {
          id: key
        }
      };
      return this._client('get', params);
    }
  }, {
    key: 'allBy',
    value: function allBy(key, value) {
      (0, _logger.debug)('= Model.allBy', key, value);
      var params = {
        TableName: this.tableName,
        KeyConditionExpression: '#hkey = :hvalue',
        ExpressionAttributeNames: { '#hkey': key },
        ExpressionAttributeValues: { ':hvalue': value }
      };
      return this._client('query', params);
    }
  }, {
    key: '_client',
    value: function _client(method, params) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        (0, _logger.debug)('Model._client', JSON.stringify(params));
        _this._db()[method](params, function (err, data) {
          if (err) {
            (0, _logger.debug)('= Model._client', method, 'Error', err);
            reject(err);
          } else {
            (0, _logger.debug)('= Model._client', method, 'Success');
            resolve(data);
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
  }]);

  return Model;
}();

module.exports.Model = Model;