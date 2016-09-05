'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('./../logger');

var _model = require('./model');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _deepAssign = require('deep-assign');

var _deepAssign2 = _interopRequireDefault(_deepAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ScheduledCampaign = function (_Model) {
  _inherits(ScheduledCampaign, _Model);

  function ScheduledCampaign() {
    _classCallCheck(this, ScheduledCampaign);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ScheduledCampaign).apply(this, arguments));
  }

  _createClass(ScheduledCampaign, null, [{
    key: 'tableName',
    get: function get() {
      return process.env.SCHEDULED_CAMPAIGNS_TABLE;
    }
  }, {
    key: 'hashKey',
    get: function get() {
      return 'campaignId';
    }
  }, {
    key: 'rangeKey',
    get: function get() {
      return 'scheduledAt';
    }
  }]);

  return ScheduledCampaign;
}(_model.Model);

module.exports.ScheduledCampaign = ScheduledCampaign;