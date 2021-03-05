const mongoose = require('./mongoose');
const bcrypt = require('bcrypt');
const { titles, sex } = require('../../constants/people');
const { lowerFirstChar } = require('../../helpers/strings');
const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = mongoose;

exports.generateUserModel = function (modelsData = {}) {
  // generate profiles schema data and roles data
  const profilesSchemaData = {};
  const rolesData = {};

  if (modelsData.profiles) {
    if (!Array.isArray(modelsData.profiles))
      throw new Error('profiles should be an array');
    for (const model of modelsData.profiles) {
      // profiles
      profilesSchemaData[lowerFirstChar(model.modelName)] = {
        type: ObjectId,
        ref: model.modelName,
      };
      // roles (permissions)
      rolesData['is' + model.modelName] = { type: Boolean, default: false };
    }
  }

  const UserSchema = new Schema({
    // roles / permissions
    ...rolesData,
    isActive: { type: Boolean, default: true },
    scope: String,

    nationalId: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    email: {
      type: String,
      trim: true,
      // optional and unique email
      index: { unique: true, sparse: true },
    },
    phoneNumber: { type: String, trim: true, required: true, unique: true },
    sex: { type: String, enum: sex, default: 'male' },
    title: { type: String, enum: titles, default: 'other' },
    jwts: [String],
    deletedBy: { type: ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    profiles: profilesSchemaData,
  });

  UserSchema.methods = {
    async getUserDeletesCount(filter) {
      const filterCopy = (typeof filter === 'object' && { ...filter }) || {};
      // required for the query to work
      delete filterCopy['deletedBy._id'];
      return this.constructor.countDocuments({
        ...filterCopy,
        deletedBy: this?._id,
        isActive: false,
        isDeleted: true,
      });
    },

    async countActions({ actionType, objectType, filter = {} } = {}) {
      if (['CREATE', 'UPDATE'].includes(actionType)) {
        if (actionType === 'CREATE') filter.createdBy = this._id;
        if (actionType === 'UPDATE') filter.modifiedBy = this._id;

        if (objectType) {
          if (objectType === 'user')
            return await this.constructor.countDocuments(filter);

          const target = modelsData[objectType];
          if (Array.isArray(target)) {
            return (
              await Promise.all(
                target.map(Model => Model.countDocuments(filter))
              )
            ).reduce((acc, val = 0) => acc + val, 0);
          } else {
            return await target.countDocuments(filter);
          }
        }

        return (
          await Promise.all(
            modelsData.ALL.map(Model => Model.countDocuments(filter))
          )
        ).reduce((acc, val = 0) => acc + val, 0);
      }

      // action = delete
      else {
        const deletedFilter = {
          'deletedBy._id': this._id,
        };

        // with this method you can't query level 3 properties
        for (const [key, value] of Object.entries(filter))
          deletedFilter['deleted.' + key] = value;

        if (objectType && objectType !== 'ALL') {
          if (objectType === 'User')
            return await this.getUserDeletesCount(deletedFilter);
          if (objectType === 'PEOPLE')
            return await modelsData.peopleBin.countDocuments(deletedFilter);
          if (objectType === 'OTHER')
            return await modelsData.otherBin.countDocuments(deletedFilter);

          if ((modelsData.modelKeys || [])?.includes(objectType))
            deletedFilter['deleted._model'] = objectType;

          if (Array.isArray(modelsData.bin)) {
            return (
              await Promise.all(
                modelsData.bin.map(Model => Model.countDocuments(deletedFilter))
              )
            ).reduce((acc, val = 0) => acc + val, 0);
          } else {
            return await modelsData.bin.countDocuments(deletedFilter);
          }
        }

        let AllPromises = [];

        if (Array.isArray(modelsData.bin)) {
          AllPromises = modelsData.bin.map(Model =>
            Model.countDocuments(deletedFilter)
          );
        } else {
          allPromises.push(modelsData.bin);
        }
        AllPromises.push(this.getUserDeletesCount(deletedFilter));

        return (await Promise.all(AllPromises)).reduce(
          (acc, val = 0) => acc + val,
          0
        );
      }
    },

    async populateProfiles() {
      // deep populate profiles` address and nextOfKin
      for (const [key, value] of Object.entries(this.profiles)) {
        if (value && key !== '$init') {
          this.populate({
            path: 'profiles',
            populate: {
              path: key,
              populate: [
                { path: 'address' },
                { path: 'nextOfKin', populate: 'address' },
              ],
            },
          });
        }
      }
      return await this.execPopulate();
    },

    async removeProfile({ profile, user }) {
      // removing removed profile linked scope
      let scopeArr = user.scope.split(' ');
      scopeArr = scopeArr.filter(
        scope => scope !== lowerFirstChar(profile.getModelName())
      );
      // remove the linked profile
      this.$set('profiles.' + lowerFirstChar(profile.getModelName()), undefined)
        // if profile is removed the role associated is set to false
        .$set('is' + profile.getModelName(), false)
        .set({ modifiedBy: user, scope: scopeArr.join(' ') });

      // NB: user is not actually deleted
      if (this.$isEmpty('profiles')) await this.deleteUser({ deletedBy: user });
      return await this.save();
    },

    async deleteUser({ deletedBy }) {
      if (!deletedBy || deletedBy?.constructor?.modelName !== 'User') {
        this.throw401(
          deletedBy,
          deletedBy,
          'You are not authorized to delete this resource'
        );
      }
      // NB: user is not actually deleted for our application to work well
      return await this.set({
        deletedBy,
        isDeleted: true,
        isActive: false,
      }).save();
    },
  };

  UserSchema.statics = {
    async deleteUser({ id: userId, deletedBy }) {
      if (!deletedBy || deletedBy?.constructor?.modelName !== 'User') {
        this.throw401(
          deletedBy,
          id,
          'You are not authorized to delete this resource'
        );
      }
      const user = await this.getDocument(userId);
      // NB: user is not actually deleted for our application to work well
      return await user.deleteUser({ deletedBy });
    },

    async getDocument(id) {
      const user = await this.withFormatErrors('findById', id);
      // throws if user is deleted
      if (!user || user.isDeleted || !user.isActive) this.throw404('id', id);
      return user;
    },

    async createUser({ nationalId, password }) {
      // get all profiles associated with the national id
      const [profiles, profileNames] = await this.getProfiles(nationalId);

      if (!profiles.length) {
        this.throw404(
          'nationalId',
          nationalId,
          `No profile found for national id \'${nationalId}\``
        );
      }

      const [
        { firstName, lastName, email, phoneNumber, sex, title },
      ] = profiles;

      const createData = {
        firstName,
        lastName,
        nationalId,
        email,
        phoneNumber,
        sex,
        title,
        password: await bcrypt.hash(password, 10),
        profiles: {},
      };

      profileNames.forEach((profName, index) => {
        // add user permissions based on profile Types
        createData['is' + profName] = true;
        // add profile references
        createData.profiles[lowerFirstChar(profName)] = profiles[index]?._id;
      });

      // check if user exists and was deleted
      let user = await this.findOne({ nationalId });

      // if user already exists
      if (user) {
        await user
          .set({
            // update user with recent data
            ...createData,
            // undo delete
            deletedBy: undefined,
            isActive: true,
            isDeleted: false,
          })
          .save();
      }
      // create user
      else user = await this.create(createData);

      // add user to associated getProfiles
      await Promise.all(
        profiles.map(profile => profile.$set('user', user).save())
      );

      return user;
    },

    async authenticate({ nationalId, password, phoneNumber } = {}) {
      // one can use phoneNumber or nationalId for login
      const user =
        (nationalId && (await this.findOne({ nationalId }))) ||
        (await this.findOne({ phoneNumber }));

      const isValidPassword =
        user &&
        password &&
        user.isActive &&
        !user.isDeleted &&
        (await bcrypt.compare(password, user.password));

      if (!isValidPassword)
        this.throw400(
          nationalId,
          nationalId,
          '_',
          'Invalid password or username'
        );

      // correct nationalId and password pair
      return await user.populateProfiles();
    },

    async getProfiles(nationalId) {
      return Promise.all(
        (modelsData.profiles || []).map(PersonModel =>
          PersonModel.findOne({ nationalId })
        )
      ).then(profiles => {
        // all profiles found
        const profObjects = profiles.filter(result => !!result);
        // names for profiles found
        const profNames = profObjects.map(prof => prof.constructor.modelName);
        // [object[],string[]]
        return [profObjects, profNames];
      });
    },
  };
  return model('User', UserSchema);
};
