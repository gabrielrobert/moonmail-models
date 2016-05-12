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