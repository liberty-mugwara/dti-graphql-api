const { MugsMongoDataSource } = require('./mugs-mongo');
const { lowerFirstChar } = require('../../helpers/strings');
const { DeletedObject } = require('../../models');

module.exports = class extends MugsMongoDataSource {
  _knownDependents = ['Manager', 'Admin', 'TrainingOfficer', 'Student'];
  constructor(mongooseModel, ...dependentModels) {
    super(mongooseModel);
    this.dependentModels = dependentModels;
    for (const dependentModel of dependentModels) {
      if (this._knownDependents.includes(dependentModel.modelName))
        this[dependentModel.modelName] = dependentModel;
    }
  }
  async delete(id, toReplaceWithId, { auth } = {}) {
    const deletedBy = await this.authorizeDelete(auth);

    // will throw if any of the provided id is not linked to a doc
    await Promise.all([
      this.getRaw(id, { authorize: false }),
      this.getRaw(toReplaceWithId, { authorize: false }),
    ]);

    // get all docs dependant on the doc to delete
    const dependents = await this.getAllLinked(id);

    // replace toDelete with the replacement
    if (dependents.length) {
      await Promise.all(
        dependents.map(dependant =>
          dependant.$set(lowerFirstChar(this.modelName), toReplaceWithId).save()
        )
      );
    }

    return await this.model.deleteDocument({
      id,
      deletedBy,
      StorageModel: DeletedObject,
      populateData: this.getPopulateData(null, 300),
    });
  }

  async update(
    { id, ...updateData } = {},
    {
      allowedUpdates = ['name'],
      mongo11000Keys = ['name'],
      resolversInfo,
      auth,
    } = {}
  ) {
    this.authorize(auth);
    const updated = await this.model.updateDocument({
      id,
      updateData: this.formatUpdateData(updateData),
      mongo11000Keys,
      allowedUpdates,
    });

    this.cache.delete(this.getCacheKey(id));

    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo),
      updated
    );
  }

  async getAllLinked(id, { auth } = {}) {
    this.authorize(auth);
    // get all docs dependant on the doc to delete
    const filter = {};
    filter[lowerFirstChar(this.modelName)] = id;
    const promises = this.dependentModels.map(model => model.find(filter));
    return (await Promise.all(promises)).flat();
  }

  async countAllLinked(id, { auth } = {}) {
    this.authorize(auth);
    // get all docs dependant on the doc to delete
    const filter = {};
    filter[lowerFirstChar(this.modelName)] = id;
    const promises = this.dependentModels.map(model =>
      model.countDocuments(filter)
    );
    return (await Promise.all(promises)).reduce((acc, val = 0) => acc + val, 0);
  }

  async countLinked(id, linkedKey, { auth } = {}) {
    this.authorize(auth);
    const filter = {};
    filter[lowerFirstChar(this.modelName)] = id;
    return (await this[linkedKey]?.countDocuments(filter)) || 0;
  }

  async getLinked(id, linkedKey, { resolversInfo, level, auth } = {}) {
    this.authorize(auth);
    const filter = {};
    filter[lowerFirstChar(this.modelName)] = id;
    const linked = await this[linkedKey]?.find(filter);

    if (linked) {
      return await this.populateDocument(
        this.getPopulateDataFromInfo(resolversInfo, level),
        linked
      );
    }
    return [];
  }
};
