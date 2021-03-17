const { MugsMongoDataSource } = require('../mugs-mongo');

module.exports = class extends MugsMongoDataSource {
  async update(
    { id, ...updateData } = {},
    { resolversInfo, level, auth } = {}
  ) {
    this.authorize(auth);
    this.cache.delete(this.getCacheKey(id));
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo, level),
      await this.model.updatePerson(id, this.formatUpdateData(updateData))
    );
  }

  async delete(id, { auth } = {}) {
    const deletedBy = await this.authorizeDelete(auth);
    return await this.model.deletePerson({ id, deletedBy });
  }

  async create(createData, { resolversInfo, level, auth } = {}) {
    this.authorize(auth);
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo, level),
      await this.model.createPerson({
        ...this.formatCreateData(createData),
        UserModel: this.User,
      })
    );
  }
};
