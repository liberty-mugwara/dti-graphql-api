// make mongoose connection
require("../../db-connection");

const { Role } = require("./other/role");
const ProfilesDataSource = require("./profiles/profile");
const { Trade } = require("./other/trade");
const { User } = require("./auth/user");
const { Example } = require("./public/example");
const {
  models: { TrainingOfficer, Manager, Student, Admin },
} = require("./config");

module.exports = {
  User: new User(),
  Trade: new Trade(),
  Role: new Role(),
  Manager: new ProfilesDataSource(Manager),
  TrainingOfficer: new ProfilesDataSource(TrainingOfficer),
  Student: new ProfilesDataSource(Student),
  Admin: new ProfilesDataSource(Admin),
  // for testing purposes
  Example: new Example(),
};
