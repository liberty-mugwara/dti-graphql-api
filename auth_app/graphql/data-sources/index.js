const { UserDataSource } = require('./user');

exports.generateUserDataSource = UserMongooseModel => ({
  User: new UserDataSource(UserMongooseModel),
});
