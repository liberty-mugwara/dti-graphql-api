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

  async update({ id, ...updateData } = {}) {
    const [_, updated] = await Promise.all([
      this.getRaw(id, { authorize: false }),
      this.model.updateOne({ _id: id }, { ...updateData }),
    ]);

    this.cache.delete(this.getCacheKey(id));

    return updated;
  }
};
