const { generateUserModel } = require('./models/user');
const { generateUserDataSource } = require('./graphql/data-sources');
const resolvers = require('./graphql/resolvers');
const typeDefs = require('./graphql/type-defs');
const { setContextGenerator } = require('./graphql/auth');

// __________API____API____API
/**
 * Returns UserModel and Graphql objects where.
 *
 * @param {{}} modelsData data about models that associates with UserApp.
 *
 * modelsData[<"objectType">] = MongooseModel or [MongooseModel]
 *
 * modelsData.profiles = [MongooseModel] :profile models for the user
 *
 * modelsData.ALL = MongooseModel or [MongooseModel]
 * all models the user interacts with excluding bins
 *
 * modelsData.modelKeys = [string]
 * all modelKeys the user interacts with excluding bins
 *
 * modelsData.bin = MongooseModel or [MongooseModel]
 * where deleted objects are stored
 *
 * @param {number} n The power, must be a natural number.
 *
 */
module.exports = function init(modelsData) {
  const UserModel = generateUserModel(modelsData);

  return {
    User: UserModel,
    graphql: {
      setContext: setContextGenerator(UserModel),
      resolvers,
      typeDefs,
      dataSources: generateUserDataSource(UserModel),
    },
  };
};
