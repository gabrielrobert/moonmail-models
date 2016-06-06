'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./../logger');

var _model = require('./model');

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Campaign = function (_Model) {
  _inherits(Campaign, _Model);

  function Campaign() {
    _classCallCheck(this, Campaign);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Campaign).apply(this, arguments));
  }

  _createClass(Campaign, null, [{
    key: 'isValid',
    value: function isValid(campaign) {
      (0, _logger.debug)('= Campaign.isValid', campaign);
      var schema = _joi2.default.object({
        userId: _joi2.default.string().required(),
        body: _joi2.default.string().required(),
        subject: _joi2.default.string().required(),
        name: _joi2.default.string().required(),
        id: _joi2.default.string().required(),
        senderId: _joi2.default.string(),
        listIds: _joi2.default.array()
      });
      return this._validate(schema, campaign);
    }
  }, {
    key: 'isValidToBeSent',
    value: function isValidToBeSent(campaign) {
      (0, _logger.debug)('= Campaign.isValidToBeSent', campaign);
      var schema = _joi2.default.object({
        userId: _joi2.default.string().required(),
        id: _joi2.default.string().required(),
        body: _joi2.default.string().required(),
        subject: _joi2.default.string().required(),
        listIds: _joi2.default.array().items(_joi2.default.string().required()).required(),
        name: _joi2.default.string().required(),
        senderId: _joi2.default.string().required()
      });
      return this._validate(schema, campaign);
    }
  }, {
    key: '_validate',
    value: function _validate(schema, campaign) {
      var result = _joi2.default.validate(campaign, schema);
      return !result.error;
    }
  }, {
    key: 'tableName',
    get: function get() {
      return process.env.CAMPAIGNS_TABLE;
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

  return Campaign;
}(_model.Model);

module.exports.Campaign = Campaign;