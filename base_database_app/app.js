const authApp = require('../auth_app/app');
const { generateDataSources } = require('./graphql/data-sources');
const resolvers = require('./graphql/resolvers');
const typeDefs = require('./graphql/type-defs');
const {
  Admin,
  Manager,
  TrainingOfficer,
  Staff,
  Student,
  Trade,
  Role,
  DeletedObject,
  DeletedPerson,
} = require('./models');
const PEOPLE = [Admin, Manager, TrainingOfficer, Student];
const OTHER = [Role, Trade];
const { User: UserModel, graphql: userGraphql } = authApp({
  PEOPLE,
  OTHER,
  Manager: Manager,
  Admin: Admin,
  TrainingOfficer: TrainingOfficer,
  Student: Student,
  Trade: Trade,
  Role: Role,
  // required
  ALL: [...PEOPLE, ...OTHER],
  profiles: [Admin, Manager, TrainingOfficer, Student],
  bin: [DeletedPerson, DeletedObject],
  peopleBin: DeletedPerson,
  otherBin: DeletedObject,
  modelKeys: ['Manager', 'Admin', 'Student', 'TrainingOfficer', 'Staff'],
});
const { User: userDataSource } = userGraphql.dataSources;

const dataSources = generateDataSources(UserModel, userDataSource);
module.exports = {
  dataSources,
  setContext: userGraphql.setContext,
  resolvers: [...userGraphql.resolvers, ...resolvers],
  typeDefs: [...userGraphql.typeDefs, ...typeDefs],
};
