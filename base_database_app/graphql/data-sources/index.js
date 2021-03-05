const Admin = require('./admin');
const Manager = require('./manager');
const Role = require('./role');
const Student = require('./student');
const Trade = require('./trade');
const TrainingOfficer = require('./training-officer');
const models = require('../../models');

exports.generateDataSources = (MongooseUserModel, userDataSource) => ({
  User: userDataSource,
  Manager: new Manager(models.Manager, MongooseUserModel),
  Trade: new Trade(
    models.Trade,
    MongooseUserModel,
    models.TrainingOfficer,
    models.Student
  ),
  Role: new Role(models.Role, MongooseUserModel, models.Manager, models.Admin),
  TrainingOfficer: new TrainingOfficer(
    models.TrainingOfficer,
    MongooseUserModel
  ),
  Student: new Student(models.Student, MongooseUserModel),
  Admin: new Admin(models.Admin, MongooseUserModel),
});
