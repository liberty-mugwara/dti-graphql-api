module.exports = {
  generateUserModel: require("./auth/user"),
  Address: require("./utils/address"),
  Admin: require("./profiles/admin"),
  NextOfKin: require("./utils/next-of-kin"),
  Manager: require("./profiles/manager"),
  TrainingOfficer: require("./profiles/training-officer"),
  Student: require("./profiles/student"),
  Role: require("./utils/role"),
  Trade: require("./utils/trade"),
  DeletedPerson: require("./trash/deleted-person"),
  DeletedObject: require("./trash/deleted-object"),
};
