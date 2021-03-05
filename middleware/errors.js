const { Error400, Error500 } = require('../errors');
const { titles, sex } = require('../constants/people');
const { oneOfListOptions } = require('../helpers');
const { isValidationError, isMongo11000Error } = require('../helpers/mongoose');
const { isError400, isError403, isError404 } = require('../helpers/errors');

const errorHandler = (err, _, res, __) => {
  console.log(err);
  // generate an easy to read msg for the error
  const error = formatErrors(err);

  // respond with error to client
  res
    .status(error.status)
    .json({ error: error?.objectMessage || error.message });
};

const formatPath = path => (path.startsWith('_') ? path.slice(1) : path);

function formatErrors(e) {
  // format Mongo 11000 Error
  if (isMongo11000Error(e)) {
    const [[path, value]] = Object.entries(e.keyValue);
    const msg = `${path} '${value}' is not available`;
    return new Error400('Errors', path, value, 'Integrity', msg);
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
    return new Error400('Errors', keys, Object.values(e.errors), null, {
      message: e._message,
      details: msgs,
    });
  }

  // format 400 errors
  if (isError400(e)) {
    const path = formatPath(e.path);
    const msg =
      e.kind === 'ObjectId'
        ? `Invalid \`${path === 'id' ? e.thrownBy : path}\` id`
        : `\`${e.path}\` should be of type ${e.kind}`;

    return e.setMessage(e.message || `${e.thrownBy} validation failed. ${msg}`);
  }

  // other 400 errors
  if (e.status === 400 || e.statusCode === 400)
    return new Error400(
      '__APP__',
      '_',
      '_',
      '_',
      'Bad request, is your JSON okay?'
    );

  // format 403 errors
  if (isError403(e))
    return e.setMessage(
      e.message ||
        (e.kind.trim() === 'update' &&
          `Updates to path \`${e.path}\` of ${e.thrownBy} are not allowed`) ||
        'Not allowed'
    );

  // format 404 errors
  if (isError404(e)) {
    const msg = `${
      !['id', '_id'].includes(e.path)
        ? e.thrownBy + ' validation failed. ' + e.path
        : e.thrownBy
    } was not found`;
    return e.setMessage(e.message || msg);
  }

  // All other errors must be handled by the above code
  // Reaching this line we assume 'Internal Server Error'
  return new Error500();
}

module.exports = {
  errorHandler,
  formatErrors,
};
