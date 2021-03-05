const errorCodeMap = new Map([
  [400, 'BAD-REQUEST'],
  [401, 'UNAUTHORIZED'],
  [403, 'FORBIDDEN'],
  [404, 'NOT-FOUND'],
  [500, 'INTERNAL-SERVER-ERROR'],
]);

class APIError extends Error {
  constructor(
    name = 'APIError',
    thrownBy = '',
    path = '',
    value = '',
    statusCode = 500,
    ...params
  ) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }

    this.name = name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.thrownBy = thrownBy;
    this.path = path;
    this.value = value;
    this.date = new Date();
  }

  setMessage(msg) {
    this.message = msg;
    return this;
  }
}

class APIGraphqlError extends Error {
  constructor(code, message = '', ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...params);

    this.extensions = {};
    this.extensions.code = code;
  }
}

class Error404 extends APIError {
  constructor(thrownBy, path, value, msg, ...params) {
    super('Not Found', thrownBy, path, value, 404, msg, ...params);
  }
}

class Error400 extends APIError {
  constructor(thrownBy, path, value, kind, msg, ...params) {
    super(
      'Bad Request',
      thrownBy,
      path,
      value,
      400,
      typeof msg === 'string' ? msg : '',
      ...params
    );
    this.kind = kind;
    // messages can be expressed as objects
    this.objectMessage = typeof msg === 'object' ? msg : undefined;
  }
}

class Error401 extends APIError {
  constructor(thrownBy, user, value, msg, ...params) {
    super('UnAuthorized', thrownBy, '__ignore__', value, 401, msg, ...params);
    // to keep track of the unauthorized user
    this.user = user;
    // if mutations were attempted keep track
    this.value = value;
  }
}

class Error403 extends APIError {
  constructor(thrownBy, path, value, kind, msg, ...params) {
    super('Bad Request', thrownBy, path, value, 403, msg, ...params);
    this.kind = kind;
  }
}

class Error500 extends APIError {
  constructor(msg = 'Internal Server Error', ...params) {
    super('Server Error', 'App', '__APP__', '__Ignore__', 500, msg, ...params);
  }
}

const formatGraphqlErrors = err => {
  const formatPath = path => (path.startsWith('_') ? path.slice(1) : path);
  console.log(err);
  const errData = err.extensions.exception;
  const code = errorCodeMap.get(errData.status);
  // modifying error if of known type

  // format 400 errors
  if (errData.status === 400) {
    const path = formatPath(errData.path);
    const msg =
      errData.kind === 'ObjectId'
        ? `Invalid \`${path === 'id' ? errData.thrownBy : path}\` id`
        : `\`${errData.path}\` should be of type ${errData.kind}`;

    err.message =
      err.message || `${errData.thrownBy} validation failed. ${msg}`;
  }

  // format 403 errors
  if (errData.status === 403) {
    err.message =
      err.message ||
      (errData.kind.trim() === 'update' &&
        `Updates to path \`${errData.path}\` of ${errData.thrownBy} are not allowed`) ||
      'Not allowed';
  }

  // format 404 errors
  else if (errData.status === 404) {
    err.message =
      err.message ||
      `${
        !['id', '_id'].includes(errData.path)
          ? errData.thrownBy + ' validation failed. ' + errData.path
          : errData.thrownBy
      } was not found`;
  }

  // format 500 errors
  else if (errData.status === 500) err.message = 'Internal server error';

  if (code) return new APIGraphqlError(code, err.message);

  return err;
};

module.exports = {
  APIError,
  APIGraphqlError,
  Error400,
  Error401,
  Error403,
  Error404,
  Error500,
  formatGraphqlErrors,
  errorCodeMap,
};
