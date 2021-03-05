const mongoose = require('./mongoose');
const bcrypt = require('bcrypt');

const Admin = require('./admin');
const Manager = require('./manager');
const TrainingOfficer = require('./training-officer');
const Student = require('./student');
const Role = require('./role');
const Trade = require('./trade');
const Staff = require('./staff');
const DeletedPerson = require('./deleted-person');
const DeletedObject = require('./deleted-object');

const { titles, sex } = require('../constants/people');
const { lowerFirstChar } = require('../helpers/strings');
const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = mongoose;

const modelsData = {
  people: [Admin, Manager, TrainingOfficer, Staff, Student],
  other: [Role, Trade],
  bin: [DeletedPerson, DeletedObject],
  Manager: Manager,
  Admin: Admin,
  TrainingOfficer: TrainingOfficer,
  Student: Student,
  Staff: Staff,
  Trade: Trade,
  Role: Role,
  BIN1: DeletedPerson,
  BIN2: DeletedObject,
};
modelsData.base = modelsData.All = [...modelsData.people, ...modelsData.other];
modelsData.bins = [modelsData.BIN1, modelsData.BIN2];

const UserSchema = new Schema({
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
  isManager: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isTrainingOfficer: { type: Boolean, default: false },
  isStudent: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  scope: String,
  jwts: [String],
  deletedBy: { type: ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  profiles: {
    admin: { type: ObjectId, ref: 'Admin' },
    manager: { type: ObjectId, ref: 'Manager' },
    student: { type: ObjectId, ref: 'Student' },
    trainingOfficer: { type: ObjectId, ref: 'TrainingOfficer' },
  },
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
        // unsupported types
        if (['BIN1', 'BIN2'].includes(objectType)) return 0;

        switch (objectType) {
          case 'User':
            return await this.constructor.countDocuments(filter);
          case 'ALL':
            break;
          case 'PEOPLE':
            return (
              await Promise.all(
                modelsData.people.map(Model => Model.countDocuments(filter))
              )
            ).reduce((acc, val = 0) => acc + val, 0);

          case 'OTHER':
            return (
              await Promise.all(
                modelsData.other.map(Model => Model.countDocuments(filter))
              )
            ).reduce((acc, val = 0) => acc + val, 0);
          default:
            return await modelsData[objectType]?.countDocuments(filter);
        }
      }

      return (
        await Promise.all(
          modelsData.base.map(Model => Model.countDocuments(filter))
        )
      ).reduce((acc, val = 0) => acc + val, 0);
    }
    // action = delete
    else {
      const bin1Types = [
        'Manager',
        'Student',
        'Admin',
        'TrainingOfficer',
        'Staff',
        'PEOPLE',
        'BIN1',
      ];
      const bin2Types = ['Trade', 'Role', 'OTHER', 'BIN2'];
      let selectedBin;

      const deletedFilter = {
        'deletedBy._id': this._id,
      };

      // with this method you can't query level 3 properties
      for (const [key, value] of Object.entries(filter))
        deletedFilter['deleted.' + key] = value;

      if (objectType && !['User', 'ALL'].includes(objectType)) {
        if (bin1Types.includes(objectType)) selectedBin = modelsData.BIN1;
        else selectedBin = modelsData.BIN2;

        if (!['OTHER', 'BIN2', 'PEOPLE', 'BIN1'].includes(objectType))
          deletedFilter['deleted._model'] = objectType;

        return await selectedBin.countDocuments(deletedFilter);
      }

      if (objectType === 'User')
        return await this.getUserDeletesCount(deletedFilter);

      const promises = modelsData.bins.map(Model =>
        Model.countDocuments(deletedFilter)
      );
      promises.push(this.getUserDeletesCount(deletedFilter));

      return (await Promise.all(promises)).reduce(
        (acc, val = 0) => acc + val,
        0
      );
    }
  },
  async populateProfiles() {
    // deep populate profiles` address and nextOfKin
    for (const [key, value] of Object.entries(this.profiles)) {
      if (value) {
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
    // remove the linked profile
    this.$set('profiles.' + lowerFirstChar(profile.getModelName()), undefined)
      // if profile is removed the role associated is set to false
      .$set('is' + profile.getModelName(), false)
      .$set('modifiedBy', user);

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

    const [{ firstName, lastName, email, phoneNumber, sex, title }] = profiles;

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
      modelsData.people.map(PersonModel => PersonModel.findOne({ nationalId }))
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

module.exports = model('User', UserSchema);
