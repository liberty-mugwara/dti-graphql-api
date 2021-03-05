const { DataSource } = require('apollo-datasource');
const { APIGraphqlError, errorCodeMap } = require('../../../errors');
const { InMemoryLRUCache } = require('apollo-server-caching');

exports.UserDataSource = class extends DataSource {
  constructor(UserMongooseModel) {
    super();
    if (!UserMongooseModel) throw new Error('UserMongooseModel is required');
    this.model = UserMongooseModel;
    this.modelName = UserMongooseModel.modelName;
  }

  initialize(data = {}) {
    this.context = data.context;
    this.cache = data.cache || new InMemoryLRUCache();
  }
  didEncounterError(error) {
    throw error;
  }

  getCacheKey(id) {
    return `mugs-mongo-${this.model.modelName}-${id}`;
  }

  authorize({ requiredRoles = [], useOR = true, allowAny = false } = {}) {
    // authorize if no requiredRoles
    if (allowAny) return;

    // authorize if user is authenticated but requiredRoles not provided
    if (this.context.user && !requiredRoles.length) return;

    for (const role of requiredRoles) {
      if (useOR) {
        // authorize if user role contains any of the requiredRoles
        if (this.context.user?.roles?.includes(role)) return;
      }
      // authorize if user role contains all of the requiredRoles
      else if (!this.context.user?.roles?.includes(role)) break;
    }
    throw new APIGraphqlError(
      errorCodeMap.get(401),
      'You are not Authorized to access this resource'
    );
  }

  async authorizeDelete(authOptions) {
    this.authorize(authOptions);
    return await this.model.getDocument(this.context.user?._id).catch(
      // if token is valid but account was deleted prevent user from
      // making deletions
      e => {
        if (e.status === 404) {
          throw new APIGraphqlError(
            errorCodeMap.get(401),
            'You are not Authorized to delete this resource because' +
              ' your user account was deleted'
          );
        }
        throw e;
      }
    );
  }

  getPopulateDataFromInfo({ fieldNodes = [] } = {}, level = 0) {
    // we only support level 0 and level 1
    const getNested = data => {
      let name = [];
      if (data.selectionSet) {
        name.push({
          path: data.name.value,
          populate: data.selectionSet.selections
            .map(getNested)
            .filter(value => typeof value === 'object')
            .flat(),
        });
      } else name = data.name.value;
      return name;
    };

    // get nested selections so we know which fields to populate
    const nestedSelections = {};
    fieldNodes.forEach(({ selectionSet: { selections } }) =>
      selections.map(selection => {
        if (selection.selectionSet) {
          nestedSelections[
            selection.name.value
          ] = selection.selectionSet.selections
            .map(getNested)
            .filter(value => typeof value === 'object');
        }
        return selection.name.value;
      })
    );

    let toPopulate = [];
    Object.entries(nestedSelections).forEach(([key, value]) => {
      if (!level) {
        const data = { path: key };
        if (value?.length) data.populate = value?.flat();
        toPopulate.push(data);
      } else toPopulate = value?.flat();
    });

    return toPopulate;
  }

  // will work for one person or an array of persons
  // populates required fields only
  async populateDocument(populateData = [], documents) {
    // only 2 levels ar supported 0 and 1
    // 0 includes base keys in population data
    // 1 excludes base keys
    try {
      // no need to populate documents
      if (!populateData.length) return documents;

      // run in || for better performance
      const populated = await Promise.all(
        (Array.isArray(documents) ? documents : [documents]).map(doc =>
          doc.populate(populateData).execPopulate()
        )
      );
      return (Array.isArray(documents) && populated) || populated[0];
    } catch (e) {
      throw e;
    }
  }

  async findAndPopulate(promise, { resolversInfo, level = 0 } = {}) {
    try {
      const docs = await promise;
      // this might boost performance
      if (!docs || (Array.isArray(docs) && !docs.length)) return docs;
      return await this.populateDocument(
        this.getPopulateDataFromInfo(resolversInfo, level),
        docs
      );
    } catch (e) {
      throw e;
    }
  }

  // get the data wrapped in a mongoose object
  async getRaw(id, { authorize = true, resolversInfo, level = 0, auth } = {}) {
    authorize && this.authorize(auth);
    return await this.findAndPopulate(this.model.getDocument(id), {
      resolversInfo,
      level,
    });
  }

  async findOneById(
    id,
    { authorize = true, resolversInfo, level = 0, auth } = {}
  ) {
    // user caching is not supported
    authorize && this.authorize(auth);

    return await this.getRaw(id, {
      authorize: false,
      resolversInfo,
      level,
    });
  }
  // alias
  getById = this.findOneById;

  async delete(id, { auth, resolversInfo } = {}) {
    const deletedBy = await this.authorizeDelete(auth);
    const deleted = await this.model.deleteUser({ id, deletedBy });
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo),
      deleted
    );
  }
  // alias
  remove = this.delete;

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

  // alias
  listAll = this.list;

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

  async registerUserExists({ nationalId, throwError = false } = {}) {
    const exists = await this.model.exists({
      nationalId,
      isDeleted: false,
    });
    if (throwError && exists) {
      throw new APIGraphqlError(
        errorCodeMap.get(403),
        'You are already registered go on and login'
      );
    }
    return exists;
  }
};
