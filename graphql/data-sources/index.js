const Admin = require('./admin');
const Manager = require('./manager');
const Role = require('./role');
const Student = require('./student');
const Trade = require('./trade');
const TrainingOfficer = require('./training-officer');
const User = require('./user');
const db = require('../../db');

module.exports = {
  User: new User(db.User),
  Manager: new Manager(db.Manager),
  Trade: new Trade(db.Trade, db.TrainingOfficer, db.Student),
  Role: new Role(db.Role, db.Manager, db.Admin),
  TrainingOfficer: new TrainingOfficer(db.TrainingOfficer),
  Student: new Student(db.Student),
  Admin: new Admin(db.Admin),
};
