const { adminResolvers } = require('./schema/admin');
const { managerResolvers } = require('./schema/manager');
const { roleResolvers } = require('./schema/role');
const { studentResolvers } = require('./schema/student');
const { trainingOfficerResolvers } = require('./schema/training-officer');
const { tradeResolvers } = require('./schema/trade');

const baseResolvers = {
  ObjectType: {
    MANAGER: 'Manager',
    USER: 'User',
    ADMIN: 'Admin',
    TRADE: 'Trade',
    ROLE: 'Role',
    STUDENT: 'Student',
    TO: 'TrainingOfficer',
    STAFF: 'Staff',
    NOK: 'NextOfKin',
    ADDRESS: 'Address',
  },

  Title: {
    DR: 'Dr.',
    HON: 'Hon.',
    MADAM: 'Madam',
    MISS: 'Miss',
    MR: 'Mr.',
    MRS: 'Mrs.',
    MS: 'Ms.',
    MX: 'Mx.',
    PROF: 'Prof.',
    OTHER: 'other',
  },
  Sex: {
    FEMALE: 'female',
    MALE: 'male',
    OTHER: 'other',
  },
};

module.exports = [
  baseResolvers,
  adminResolvers,
  managerResolvers,
  roleResolvers,
  studentResolvers,
  trainingOfficerResolvers,
  tradeResolvers,
];
