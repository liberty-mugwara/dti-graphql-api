const { registrationResolvers } = require("./schema/registration");
const { authResolvers } = require("./schema/auth");
const { adminResolvers } = require("./schema/admin");
const { managerResolvers } = require("./schema/manager");
const { roleResolvers } = require("./schema/role");
const { studentResolvers } = require("./schema/student");
const { trainingOfficerResolvers } = require("./schema/training-officer");
const { tradeResolvers } = require("./schema/trade");
const { userResolvers } = require("./schema/user");

// for testing purposes
const { exampleResolvers } = require("./schema/public/example");

const baseResolvers = {
  ObjectType: {
    MANAGER: "Manager",
    USER: "User",
    ADMIN: "Admin",
    TRADE: "Trade",
    ROLE: "Role",
    STUDENT: "Student",
    TO: "TrainingOfficer",
    STAFF: "Staff",
    NOK: "NextOfKin",
    ADDRESS: "Address",
    EXAMPLE: "Example",
  },

  Title: {
    DR: "Dr.",
    HON: "Hon.",
    MADAM: "Madam",
    MISS: "Miss",
    MR: "Mr.",
    MRS: "Mrs.",
    MS: "Ms.",
    MX: "Mx.",
    PROF: "Prof.",
    OTHER: "other",
  },
  Sex: {
    FEMALE: "female",
    MALE: "male",
    OTHER: "other",
  },
};

module.exports = [
  baseResolvers,
  registrationResolvers,
  authResolvers,
  adminResolvers,
  managerResolvers,
  roleResolvers,
  studentResolvers,
  trainingOfficerResolvers,
  tradeResolvers,
  userResolvers,

  // for testing purposes
  exampleResolvers,
];
