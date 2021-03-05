const withCatch = async (promise, ...params) => {
  return await promise(...params).catch(e => {
    throw e;
  });
};

module.exports = { withCatch };
