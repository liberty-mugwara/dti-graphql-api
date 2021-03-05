const jwt = require('jsonwebtoken');
const { APIGraphqlError, errorCodeMap } = require('../../../errors');
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

function getUser(token, verify = true) {
  try {
    if (verify) return (token && jwt.verify(token, JWT_SECRET)) || null;
    else return jwt.decode(token) || null;
  } catch (e) {
    return null;
  }
}

function setContextGenerator(User) {
  async function verifyAccessToken(userId, token) {
    try {
      const user = await User.getDocument(userId);

      const storedToken = user.jwts.find(jwt => jwt === token);

      return (storedToken && jwt.verify(storedToken, JWT_SECRET)) || null;
    } catch (e) {
      return null;
    }
  }
  return async function setContext({ req }) {
    const token = (req.get('Authorization') || '').replace('Bearer', '').trim();
    const regUser = getUser(token);
    const revokeTokenData = getUser(token, false);
    const user = await verifyAccessToken(regUser?._id, token);
    return { user, regUser, revokeTokenData, token };
  };
}

function authorize(user, scopes = [], options = { useOR: true }) {
  // authorize if no scopes
  if (!scopes.length) return;

  // authorize if user scope contains any of the scopes
  for (const scope of scopes)
    if (options.useOR) {
      if (user?.roles?.includes(scope)) return;
    } else if (!user?.roles?.includes(scope)) break;
  throw new APIGraphqlError(
    errorCodeMap.get(401),
    'You are not Authorized to access this resource'
  );
}

function generateScope(user) {
  let scope = '';
  const scopes = ['Manager', 'Student', 'TrainingOfficer', 'Admin'];
  for (const _scope of scopes) {
    if (user['is' + _scope]) scope += _scope.toLowerCase() + ' ';
  }
  return scope.trim();
}

function validateProfile(profile) {
  const profiles = ['Admin', 'Manager', 'Student', 'TrainingOfficer'];
  if (profiles.includes(profile)) return true;
  throw new APIGraphqlError(errorCodeMap.get(500), 'Internal Server Error');
}

function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (e) {
    throw new APIGraphqlError(errorCodeMap.get(500), 'Internal Server Error');
  }
}

async function generateAccessToken(user) {
  try {
    const scope = generateScope(user);
    const token = generateToken({
      roles: scope.split(' '),
      _id: user._id,
      nationalId: user.nationalId,
    });
    user.scope = scope;
    user.jwts.push(token);
    return {
      token,
      user: await user.save(),
    };
  } catch (e) {
    throw e;
  }
}

function generateRegToken(profile, _id, nationalId, isVerified = false) {
  // make sure input is valid
  // invalid input = useless token
  validateProfile(profile);

  if (!(_id && nationalId)) {
    throw new APIGraphqlError(errorCodeMap.get(500), 'Internal Server Error');
  }

  return generateToken({
    scope: 'registration',
    profile,
    _id,
    nationalId,
    isVerified,
  });
}

function validateRegTokenData(tokenData) {
  if (
    !(
      tokenData &&
      tokenData?._id &&
      tokenData?.profile &&
      tokenData?.nationalId &&
      tokenData?.scope === 'registration' &&
      typeof tokenData?.isVerified === 'boolean'
    )
  )
    throw new APIGraphqlError(
      errorCodeMap.get(401),
      'You are not authorized to register your account.' +
        ' You must provide your nationalId to get authorization'
    );
  return tokenData;
}

module.exports = {
  authorize,
  getUser,
  setContextGenerator,
  generateToken,
  generateRegToken,
  validateRegTokenData,
  generateScope,
  validateProfile,
  generateAccessToken,
};
