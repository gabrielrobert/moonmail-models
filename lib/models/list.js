'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _logger = require('./../logger');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var List = function (_Model) {
  _inherits(List, _Model);

  function List() {
    _classCallCheck(this, List);

    return _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).apply(this, arguments));
  }

  _createClass(List, null, [{
    key: 'createFileImportStatus',
    value: function createFileImportStatus(userId, listId, file, status) {
      (0, _logger.debug)('= List.createFileImportStatus', userId, listId, file, status);
      var addParams = {
        Key: {
          userId: userId,
          id: listId
        },
        TableName: this.tableName,
        UpdateExpression: 'SET #importStatus.#file = :newStatus',
        ExpressionAttributeNames: {
          '#importStatus': 'importStatus',
          '#file': file
        },
        ExpressionAttributeValues: {
          ':newStatus': status
        }
      };
      return this._client('update', addParams);
    }
  }, {
    key: 'updateImportStatus',
    value: function updateImportStatus(userId, listId, file, status) {
      (0, _logger.debug)('= List.updateImportStatus', userId, listId, file, status);
      var addParams = {
        Key: {
          userId: userId,
          id: listId
        },
        TableName: this.tableName,
        UpdateExpression: 'SET #importStatus.#file.#status = :newStatus, #importStatus.#file.#dateField = :newDate, #importStatus.#file.#importing = :importingValue',
        ExpressionAttributeNames: {
          '#importStatus': 'importStatus',
          '#file': file,
          '#status': 'status',
          '#dateField': status.dateField,
          '#importing': 'importing'
        },
        ExpressionAttributeValues: {
          ':newStatus': status.text,
          ':newDate': status.dateValue,
          ':importingValue': status.isImporting
        }
      };
      return this._client('update', addParams);
    }
  }, {
    key: 'tableName',
    get: function get() {
      return process.env.LISTS_TABLE;
    }
  }, {
    key: 'hashKey',
    get: function get() {
      return 'userId';
    }
  }, {
    key: 'rangeKey',
    get: function get() {
      return 'id';
    }
  }]);

  return List;
}(_model.Model);

module.exports.List = List;