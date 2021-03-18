const { MugsMongoDataSource } = require("../mugs-mongo");
const {
  models: { Example },
} = require("../config");

exports.Example = class extends MugsMongoDataSource {
  constructor() {
    super(Example);
  }

  async create({ name }) {
    return await this.model.create({ name });
  }

  // no auth, no trash
  async delete(id) {
    // will throw if any of the provided id is not linked to a doc
    const [example] = await Promise.all([
      this.getRaw(id, { authorize: false }),
      this.model.deleteOne({ _id: id }),
    ]);

    return example;
  }

  async update(
    { id, ...updateData } = {},
    { allowedUpdates = ["name"], mongo11000Keys = ["name"] } = {}
  ) {
    const updated = await this.model.updateDocument({
      id,
      updateData: updateData,
      mongo11000Keys,
      allowedUpdates,
    });

    this.cache.delete(this.getCacheKey(id));

    return updated;
  }
};
