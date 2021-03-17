const { MugsMongoDataSource } = require('../mugs-mongo');
const { User } = require('../config').models;

exports.User = class extends MugsMongoDataSource {
  constructor() {
    super(User);
  }

  async delete(id, { auth, resolversInfo } = {}) {
    const deletedBy = await this.authorizeDelete(auth);
    const deleted = await this.model.deleteUser({ id, deletedBy });
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo),
      deleted
    );
  }
  async authenticate(nationalId, password, { resolversInfo, level } = {}) {
    return await this.findAndPopulate(
      this.model.authenticate(nationalId, password),
      { resolversInfo, level }
    );
  }

  async list({ resolversInfo, level = 0, auth } = {}) {
    this.authorize(auth);
    return await this.findAndPopulate(this.model.find({ isDeleted: false }), {
      resolversInfo,
      level,
    });
  }

  async count(filter, { auth } = {}) {
    this.authorize(auth);
    filter = filter || {};
    filter.isDeleted = false;
    return this.model.countDocuments(filter);
  }

  async countActions(
    { userId, actionType, filter: filterObj } = {},
    { auth } = {}
  ) {
    this.authorize(auth);
    filterObj = filterObj || {};
    const { objectType = null, filter } = filterObj;
    const user = await this.getById(userId, { auth });
    return await user.countActions({
      actionType,
      objectType,
      filter: filter || {},
    });
  }
};
