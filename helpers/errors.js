const {
  APIError,
  Error403,
  Error400,
  Error404,
  Error500,
} = require('../errors');
const { isString } = require('./strings');

const isAPIError = e => e instanceof APIError;
const isError400 = e => e instanceof Error400;
const isError403 = e => e instanceof Error403;
const isError404 = e => e instanceof Error404;

function throw400(path, value, kind, msg = '') {
  throw new Error400(this.modelName, path, value, kind, msg);
}

function throw403(path, value, kind, msg = '') {
  throw new Error403(this.modelName, path, value, kind, msg);
}

function throw404(path, value, msg = '') {
  throw new Error404(this.modelName, path, value, msg);
}

function throw500(msg) {
  throw new Error500(msg);
}

function throwRequired(path, msg = `\`${path}\` is required!`) {
  throw400.call(this, path, undefined, undefined, msg);
}

function throwInvalidType(path, value, kind) {
  throw400.call(this, path, value, kind);
}

module.exports = {
  isAPIError,
  isError400,
  isError403,
  isError404,
  throw400,
  throw403,
  throw404,
  throw500,
  throwInvalidType,
  throwRequired,
};
