'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _link = require('./models/link');

Object.keys(_link).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _link[key];
    }
  });
});

var _campaign = require('./models/campaign');

Object.keys(_campaign).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _campaign[key];
    }
  });
});

var _report = require('./models/report');

Object.keys(_report).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _report[key];
    }
  });
});

var _sent_email = require('./models/sent_email');

Object.keys(_sent_email).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _sent_email[key];
    }
  });
});