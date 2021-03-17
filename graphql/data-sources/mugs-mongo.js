const { DataSource } = require('apollo-datasource');
const { APIGraphqlError, errorCodeMap } = require('../../errors');
const { InMemoryLRUCache } = require('apollo-server-caching');
const { User, DeletedObject } = require('./config').models;

exports.MugsMongoDataSource = class extends DataSource {
  constructor(mongooseModel) {
    super();
    if (!mongooseModel) throw new Error('mongooseModel is required');
    this.model = mongooseModel;
    this.modelName = mongooseModel.modelName;
    this.User = User;
  }

  initialize(data = {}) {
    this.context = data.context;
    this.cache = data.cache || new InMemoryLRUCache();
    this.data = data;
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
    return await this.User.getDocument(this.context.user?._id).catch(
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

  formatCreateData(data = {}) {
    if (!this.context.user?._id) {
      throw new APIGraphqlError(
        errorCodeMap.get(401),
        'You are not Authorized to create documents'
      );
    }
    data.createdBy = this.context.user._id;
    return data;
  }

  formatUpdateData(data = {}) {
    if (!this.context.user?._id) {
      throw new APIGraphqlError(
        errorCodeMap.get(401),
        'You are not Authorized to create documents'
      );
    }
    data.modifiedBy = this.context.user._id;
    return data;
  }

  getPopulateData(info, ttl, level = 0) {
    const populateProfilesData = [
      'address',
      'modifiedBy',
      'createdBy',
      'trade',
      'role',
      { path: 'nextOfKin', populate: 'address' },
    ];

    const populateUserData = [
      {
        path: 'profiles',
        populate: ['manager', 'admin', 'trainingOfficer', 'student'].map(
          path => ({
            path,
            populate: populateProfilesData,
          })
        ),
      },
    ];
    const populatePersonData = [
      ...populateProfilesData,
      { path: 'user', populate: populateUserData },
    ];

    const fullPopulateData = {
      User: populateUserData,
      Manager: populatePersonData,
      Admin: populatePersonData,
      TrainingOfficer: populatePersonData,
      Student: populatePersonData,
    };

    if (ttl) {
      return (
        fullPopulateData[this.model.modelName] || ['modifiedBy', 'createdBy']
      );
    } else return this.getPopulateDataFromInfo(info, level);
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

  async findAndPopulate(promise, { resolversInfo, ttl, level = 0 } = {}) {
    try {
      const docs = await promise;
      // this might boost performance
      if (!docs || (Array.isArray(docs) && !docs.length)) return docs;
      return await this.populateDocument(
        this.getPopulateData(resolversInfo, ttl, level),
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
    { authorize = true, ttl, resolversInfo, level = 0, auth } = {}
  ) {
    authorize && this.authorize(auth);

    const cacheDoc = await this.cache.get(this.getCacheKey(id));

    if (cacheDoc) return cacheDoc;
    // if ttl it will deep populate the doc and cache the value
    // so that future requests of qny query will be valid
    const doc = await this.getRaw(id, {
      authorize: false,
      resolversInfo,
      ttl,
      level,
    });

    if (ttl) this.cache.set(this.getCacheKey(id), doc.toJSON(), { ttl });
    return doc;
  }
  // alias
  getById = this.findOneById;

  async list({ resolversInfo, level = 0, auth } = {}) {
    this.authorize(auth);
    return await this.findAndPopulate(this.model.find(), {
      resolversInfo,
      level,
    });
  }

  // alias
  listAll = this.list;

  async create(createData, { resolversInfo, level, auth } = {}) {
    this.authorize(auth);
    const created = await this.model.createDocument(
      this.formatCreateData(createData)
    );
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo, level),
      created
    );
  }

  async delete(id, { auth } = {}) {
    const deletedBy = await this.authorizeDelete(auth);
    return await this.model.deleteDocument({
      id,
      deletedBy,
      StorageModel: DeletedObject,
      populateData: this.getPopulateData(null, 300),
    });
  }

  // alias
  remove = this.delete;

  async update(
    { id, ...updateData } = {},
    { allowedUpdates = [], mongo11000Keys, resolversInfo, auth } = {}
  ) {
    this.authorize(auth);
    const updated = await this.model.updateDocument({
      id,
      updateData: this.formatUpdateData(updateData),
      allowedUpdates,
      mongo11000Keys,
    });
    this.cache.delete(this.getCacheKey(id));
    return await this.populateDocument(
      this.getPopulateDataFromInfo(resolversInfo),
      updated
    );
  }

  async isAvailable(filter = {}, { auth } = {}) {
    this.authorize(auth);
    return !(await this.model.exists(filter));
  }

  async isNationalIdAvailable(nationalId, { auth } = {}) {
    return await this.isAvailable({ nationalId }, { auth });
  }

  async isEmailAvailable(email, { auth } = {}) {
    return await this.isAvailable({ email }, { auth });
  }

  async count(filter, { auth } = {}) {
    this.authorize(auth);
    if (filter) return this.model.countDocuments(filter);

    return this.model.estimatedDocumentCount();
  }
};
