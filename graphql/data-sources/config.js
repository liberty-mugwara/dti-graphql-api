const {
  generateUserModel,
  Admin,
  Manager,
  TrainingOfficer,
  Student,
  Trade,
  Role,
  Address,
  NextOfKin,
  DeletedObject,
  DeletedPerson,
} = require('../../models');

// ------- configuring user Model ------ //

// for user actions count
const PEOPLE = [Admin, Manager, TrainingOfficer, Student];
const OTHER = [Role, Trade];
const modelsData = {
  // ---- required: START ---- //
  // user profiles: for setting user profiles
  // this affects the user model schema
  profiles: [Admin, Manager, TrainingOfficer, Student],

  // for counts when actions in [ "CREATE", "UPDATE"]
  ALL: [...PEOPLE, ...OTHER],

  // for counting all deleted
  bin: [DeletedPerson, DeletedObject],
  // for counting deleted people
  peopleBin: DeletedPerson,
  // for counting things deleted other than people
  otherBin: DeletedObject,
  // for counting specific types of things deleted
  modelKeys: [
    'Manager',
    'Admin',
    'Student',
    'TrainingOfficer',
    'Staff',
    'Trade',
    'Role',
    'Address',
    'NextOfKin',
  ],
  // ---- required: END ---- //

  // for user actions counts
  PEOPLE,
  OTHER,
  Manager: Manager,
  Admin: Admin,
  TrainingOfficer: TrainingOfficer,
  Student: Student,
  Trade: Trade,
  Role: Role,
};

module.exports = {
  models: {
    User: generateUserModel(modelsData),
    Admin,
    Manager,
    TrainingOfficer,
    Student,
    DeletedObject,
    DeletedPerson,
    Trade,
    Role,
    Address,
    NextOfKin,
  },
};
