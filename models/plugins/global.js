const ObjectId = require('mongoose').Schema.Types.ObjectId;

const {
  Error403,
  Error400,
  Error404,
  Error500,
  Error401,
} = require('../../errors');
const {
  isCastError,
  isMongo11000Error,
  isValidationError,
} = require('../../helpers/mongoose');

exports.modelNamePlugin = function (schema, options) {
  function getModelName() {
    return this?.modelName || this.constructor.modelName;
  }
  schema.static({ getModelName });
  schema.method({ getModelName });
};

exports.documentHandlerPlugin = function (schema, options) {
  // create method for all documents
  schema.static({
    // prevent Mongo 11000 error
    async preventMongo11000(data = {}, keys = []) {
      if (!keys.length) return;
      const promises = keys.map(key => {
        const filter = {};
        filter[key] = data[key];
        return this.exists(filter).then(exists => (exists && key) || false);
      });

      if (promises.length) {
        await Promise.all(promises).then(results =>
          // path means key exists
          results.forEach(path => {
            if (path) {
              this.throw400(
                path,
                data[path],
                'Integrity',
                `${path} '${data[path]}' is already taken`
              );
            }
          })
        );
      }
    },

    async withFormatErrors(method, ...params) {
      try {
        const fn = typeof method === 'string' ? this[method] : method;
        return await fn.call(this, ...params);
      } catch (e) {
        // format cast errors
        if (isCastError(e)) throw this.formatCastErrors(e);

        // format Mongo 11000 Error
        if (isMongo11000Error(e)) {
          const [[path, value]] = Object.entries(e.keyValue);
          const msg = `${path} '${value}' is already taken`;
          this.throw400(path, value, 'Integrity', msg);
        }

        // format mongoose validation errors
        if (isValidationError(e)) {
          // e.errors is an object not an array
          const keys = Object.keys(e.errors);
          const msgs = keys.map(
            key =>
              `\`${e.errors[key].path}\` ${
                ['sex', 'title'].includes(key)
                  ? oneOfListOptions(key === 'sex' ? sex : titles)
                  : 'should be of type ' + e.errors[key].kind
              }`
          );
          this.throw400(keys, Object.values(e.errors), null, {
            message: e._message,
            details: msgs,
          }).setMessage(e._message);
        }

        throw e;
      }
    },
    async createDocument(createData) {
      return await this.withFormatErrors('create', createData);
    },

    // delete method for all documents
    async deleteDocument({ id, deletedBy, StorageModel, populateData } = {}) {
      const getRelevantUserFields = (user = {}) => {
        // remove unnecessary fields
        const {
          __v,
          password,
          jwts,
          createdBy,
          createdAt,
          modifiedBy,
          updatedAt,
          ...relevantFields
        } = (typeof user.toObject === 'function' && user.toObject()) || user;
        return relevantFields;
      };
      // if provided user id is not valid i.e user not found
      if (!deletedBy || deletedBy?.constructor?.modelName !== 'User') {
        this.throw401(
          deletedBy,
          id,
          'You are not authorized to delete this resource'
        );
      }
      if (!StorageModel) {
        this.throw500(
          'Storage model is required. Use either DeletedPerson or DeletedObject'
        );
      }
      if (
        !['DeletedPerson', 'DeletedObject'].includes(StorageModel.modelName)
      ) {
        this.throw500(
          'Invalid storageModel. Use either DeletedPerson or DeletedObject'
        );
      }

      // get toDelete
      const toDelete = await this.getDocument(id);

      // populate toDelete
      if (populateData) {
        await toDelete.populate(populateData).execPopulate();
      }

      // save toDelete in StorageModel collection
      await StorageModel.create({
        deletedBy: getRelevantUserFields(deletedBy),
        deleted: {
          ...toDelete.toObject(),
          createdBy: getRelevantUserFields(toDelete.createdBy),
          modifiedBy: getRelevantUserFields(toDelete.modifiedBy),
          _model: this.modelName,
        },
      });
      // attach deletedBy, for use by middleware
      toDelete.deletedBy = deletedBy;
      // allows our delete middleware to be executed
      return await toDelete.remove();
    },

    // get method for all documents
    async getDocument(id) {
      const doc = await this.withFormatErrors('findById', id);
      if (!doc) this.throw404('id', id);
      return doc;
    },

    // update method for all documents
    async updateDocument({
      id,
      updateData: rawUpdateData,
      allowedUpdates = [],
      mongo11000Keys = [],
      updateOptions = { new: true, runValidators: true },
    } = {}) {
      const { modifiedBy, ...updateData } = rawUpdateData || {};
      this.checkAllowedUpdates(updateData, allowedUpdates);
      await this.preventMongo11000(updateData, mongo11000Keys || []);
      const updated = await this.findByIdAndUpdate(
        id,
        { ...updateData, modifiedBy },
        updateOptions
      );
      if (!updated) this.throw404('id', id);
      return updated;
    },
  });
};

const errorHandlers = {
  throw400(path, value, kind, msg = '') {
    throw new Error400(this.getModelName(), path, value, kind, msg);
  },
  throw401(user, value, msg = '') {
    throw new Error401(this.getModelName(), user, value, msg);
  },

  throw403(path, value, kind, msg = '') {
    throw new Error403(this.getModelName(), path, value, kind, msg);
  },

  throw404(path, value, msg = '') {
    throw new Error404(this.getModelName(), path, value, msg);
  },

  throw500(msg) {
    throw new Error500(msg);
  },

  throwRequired(path, msg = `\`${path}\` is required!`) {
    this.throw400(path, undefined, undefined, msg);
  },

  throwInvalidType(path, value, kind) {
    this.throw400(path, value, kind);
  },

  formatCastErrors({ path, value, kind } = {}) {
    return new Error400(this.getModelName(), path, value, kind);
  },
};

exports.errorHandlerPlugin = function (schema, options) {
  schema.static(errorHandlers);
  schema.method(errorHandlers);
};

exports.checkAllowedUpdatesPlugin = function (schema, options) {
  schema.static(
    'checkAllowedUpdates',
    function (updateData, allowedUpdates, exclude = []) {
      if (typeof updateData !== 'object' || Array.isArray(updateData))
        this.throw400(
          '__all',
          '_',
          '_',
          `Update data should be of object type`
        );

      let invalidKey = '';
      const allowUpdate = Object.keys(updateData).every(key => {
        invalidKey = key;
        return allowedUpdates.includes(key) || exclude.includes(key);
      });

      if (!allowUpdate)
        this.throw403(invalidKey, updateData[invalidKey], 'update');
    }
  );
};

exports.mutationsByPlugin = function (schema, options) {
  schema.add({
    createdBy: { type: ObjectId, ref: 'User' },
    modifiedBy: { type: ObjectId, ref: 'User' },
  });
};

exports.timestampsPlugin = function (schema, options) {
  schema.set('timestamps', true);
};
