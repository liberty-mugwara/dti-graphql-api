const mongoose = require('mongoose');
const { Error400 } = require('../errors');

const formatPath = path => (path.startsWith('_') ? path.slice(1) : path);
const isCastError = e => e instanceof mongoose.Error.CastError;
const isValidationError = e => e instanceof mongoose.Error.ValidationError;
const isMongo11000Error = e => e.name === 'MongoError' && e.code === 11000;

function formatCastErrors({ path, value, kind } = {}) {
  return new Error400(this.modelName, path, value, kind);
}

async function catchCastErrors(asyncFn, ...params) {
  // you must bind this when calling this function
  try {
    return await asyncFn.call(this, ...params);
  } catch (e) {
    // format cast errors
    if (isCastError(e)) throw formatCastErrors.call(this, e);

    // format Mongo 11000 Error
    if (isMongo11000Error(e)) {
      const [[path, value]] = Object.entries(e.keyValue);
      const msg = `${path} '${value}' is not available`;
      throw new Error400(this.modelName, path, value, 'Integrity', msg);
    }

    // format mongoose validation errors
    if (isValidationError(e)) {
      // e.errors is an object not an array
      const keys = Object.keys(e.errors);
      const msgs = keys.map(
        key =>
          `\`${e.errors[key].path}\` ${
            ['sex', 'title'].includes(key)
              ? oneOfListOptions(key === 'sex' ? sex : titles)
              : 'should be of type ' + e.errors[key].kind
          }`
      );
      const err = Error400('Errors', keys, Object.values(e.errors), null, {
        message: e._message,
        details: msgs,
      });
      err.setMessage(e._message);
      throw err;
    }

    throw e;
  }
}

module.exports = {
  isCastError,
  isValidationError,
  isMongo11000Error,
  formatCastErrors,
  catchCastErrors,
};
