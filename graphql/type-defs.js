const { gql } = require('apollo-server-express');
const { registrationTypes } = require('./schema/registration');
const { authTypes } = require('./schema/auth');
const { adminTypes } = require('./schema/admin');
const { managerTypes } = require('./schema/manager');
const { roleTypes } = require('./schema/role');
const { studentTypes } = require('./schema/student');
const { trainingOfficerTypes } = require('./schema/training-officer');
const { tradeTypes } = require('./schema/trade');
const { addressTypes } = require('./schema/address');
const { nextOfKinTypes } = require('./schema/next-of-kin');
const { userTypes } = require('./schema/user');

// required
const baseTypes = gql`
  enum ActionType {
    CREATE
    DELETE
    UPDATE
  }

  enum ObjectType {
    ALL
    PEOPLE
    OTHER
    MANAGER
    USER
    ADMIN
    TRADE
    ROLE
    STUDENT
    TO
    STAFF
    NOK
    ADDRESS
    BIN1
    BIN2
  }

  enum Title {
    DR
    HON
    MADAM
    MISS
    MR
    MRS
    MS
    MX
    PROF
    OTHER
  }

  enum Sex {
    FEMALE
    MALE
    OTHER
  }

  type Query {
    _name: String
  }
  type Mutation {
    _name: String
  }
`;

module.exports = [
  baseTypes,
  registrationTypes,
  authTypes,
  addressTypes,
  adminTypes,
  managerTypes,
  roleTypes,
  studentTypes,
  trainingOfficerTypes,
  tradeTypes,
  nextOfKinTypes,
  userTypes,
];
