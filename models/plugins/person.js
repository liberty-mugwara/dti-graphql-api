const generateUniqueId = require('generate-unique-id');
const ObjectId = require('mongoose').Schema.Types.ObjectId;

const Address = require('../utils/address');
const NextOfKin = require('../utils/next-of-kin');
const Trade = require('../utils/trade');
const Role = require('../utils/role');
const DeletedPerson = require('../recycle-bin/deleted-person');

const { titles, sex } = require('../../constants/people');
const { addOrUpdateOwned, updateTradeOrRole } = require('../profiles/helpers');
const { lowerFirstChar } = require('../../helpers/strings');
const { isAPIError } = require('../../helpers/errors');
const { isCastError } = require('../../helpers/mongoose');

module.exports = function personPlugin(schema, { role, trade } = {}) {
  const addOrUpdateAddress = addOrUpdateOwned(Address);
  const addOrUpdateNextOfKin = addOrUpdateOwned(NextOfKin);
  const updateTrade = updateTradeOrRole(Trade);
  const updateRole = updateTradeOrRole(Role);

  // universal options
  schema.add({
    user: { type: ObjectId, ref: 'User' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true, unique: true, required: true },
    sex: { type: String, enum: sex, default: 'male' },
    title: { type: String, enum: titles, default: 'other' },
    address: { type: ObjectId, ref: 'Address' },
    nextOfKin: { type: ObjectId, ref: 'NextOfKin' },
    dob: Date,
    nationalId: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      // optional and unique email
      index: { unique: true, sparse: true },
    },
    // RVC: Registration Verification Code
    RVC: {
      type: String,
      default: () =>
        generateUniqueId({
          length: 6,
          useLetters: false,
        }),
    },
    relation: {
      type: String,
      trim: true,
    },
  });

  // add role if required
  if (role)
    schema.add({ role: { type: ObjectId, required: true, ref: 'Role' } });

  // add trade if required
  if (trade)
    schema.add({ trade: { type: ObjectId, required: true, ref: 'Trade' } });

  schema.pre('remove', async function () {
    const toDelete = this;
    await Promise.all([
      toDelete.address?.removeOwner(toDelete),
      toDelete.nextOfKin?.removeOwner(toDelete),
      toDelete.user?.removeProfile({
        profile: toDelete,
        user: toDelete.deletedBy,
      }),
    ]);
  });

  /* STATICS */
  schema.static({
    async createPerson(createData) {
      // defined out of try block for the catch block to access this variable
      const PersonModel = this;

      try {
        const {
          UserModel,
          trade,
          role,
          RVC,
          nextOfKin: nextOfKinData,
          address: addressData,
          ...allowedCreateData
        } = createData || {};

        if (['Student', 'TrainingOfficer'].includes(PersonModel.modelName)) {
          if (!trade) PersonModel.throwRequired('trade');

          if (!(await Trade.exists({ _id: trade })))
            PersonModel.throw404('trade', trade);

          allowedCreateData.trade = trade;
        } else {
          if (!role) PersonModel.throwRequired('role');

          if (!(await Role.exists({ _id: role })))
            PersonModel.throw404('role', role);

          allowedCreateData.role = role;
        }

        // validate input
        await Promise.all([
          PersonModel.validate({ ...allowedCreateData, trade, role }),
          PersonModel.preventMongo11000(allowedCreateData, [
            'nationalId',
            'phoneNumber',
            'email',
          ]),
        ]);

        const promises = [];
        // create address if provided
        if (addressData) promises.push(Address.createDocument(addressData));

        // create nextOfKin if provided
        if (nextOfKinData)
          promises.push(NextOfKin.createNextOfKin(nextOfKinData));

        // run in || for better performance
        const [address, nextOfKin] = await Promise.all(promises);
        if (address) allowedCreateData.address = address._id;
        if (nextOfKin) allowedCreateData.nextOfKin = nextOfKin._id;

        const [person, user] = await Promise.all([
          // create person
          PersonModel.createDocument(allowedCreateData),
          // check if user with the same national id is already created
          UserModel.findOne({ nationalId: createData.nationalId }),
        ]);

        if (user) {
          const modelKey = lowerFirstChar(PersonModel.modelName);
          // link user to person
          person.$set('user', user?._id);
          // link person to user
          user
            .$set('profiles.' + modelKey, person._id)
            .$set('scope', `${user.scope} ${modelKey}`)
            .$set('is' + modelKey, true);
        }

        await Promise.all([
          address?.addOwner(person),
          nextOfKin?.addOwner(person),
          person.save(),
          user?.save(),
        ]);
        return person;
      } catch (e) {
        // Correct thrownBy, and path
        if (isAPIError(e)) {
          if (e.thrownBy !== PersonModel.modelName) {
            e.path = e.thrownBy?.toLowerCase();
            e.thrownBy = PersonModel.modelName;
          }
          throw e;
        }

        // handle other errors
        throw (isCastError(e) && PersonModel.formatCastErrors(e)) || e;
      }
    },

    async updatePerson(id, { modifiedBy, ...updateData }) {
      const PersonModel = this;
      try {
        PersonModel.checkAllowedUpdates(updateData, [
          // RVC should not be in this list
          // I'm happy you understand
          'address',
          'dob',
          'email',
          'firstName',
          'lastName',
          'nationalId',
          'nextOfKin',
          'owners',
          'phoneNumber',
          'relation',
          'sex',
          'title',
          'trade',
          'role',
          'nextOfKin',
          'address',
        ]);

        const {
          address,
          nextOfKin,
          trade: { id: tradeId } = {},
          role: { id: roleId } = {},
          ...allowedUpdateData
        } = updateData;

        // validate input
        await PersonModel.preventMongo11000(updateData, [
          'nationalId',
          'phoneNumber',
          'email',
        ]);

        // get person
        const person = await PersonModel.getDocument(id);

        await Promise.all([
          // if trade is updated
          updateTrade(person, tradeId),

          // if role is updated
          updateRole(person, roleId),

          // if nextOfKin is updated
          addOrUpdateNextOfKin(person, nextOfKin),

          // if address is updated
          addOrUpdateAddress(person, address),
        ]);

        // update other person data
        await person.$set({ ...allowedUpdateData, modifiedBy }).save();

        if (person.user) {
          await person.populate('user').execPopulate();
          const userUpdateData = {};
          let updateUser = false;
          const allowedKeys = [
            'sex',
            'title',
            'firstName',
            'lastName',
            'phoneNumber',
            'email',
            'nationalId',
          ];
          for (const [key, value] of Object.entries(allowedUpdateData)) {
            if (allowedKeys.includes(key)) {
              updateUser = true;
              userUpdateData[key] = value;
            }
          }
          if (person.populated('user')) {
            // update user
            updateUser && (await person.user.set(userUpdateData).save());
            // populate user
            await person.user
              .populate({
                path: 'profiles',
                populate: ['manager', 'admin', 'trainingOfficer', 'student'],
              })
              .execPopulate();
            // update other linked profiles
            const profilePromises = [];
            for (const [key, profile] of Object.entries(person.user.profiles)) {
              if (
                profile?.constructor?.modelName &&
                !['$init', lowerFirstChar(PersonModel.modelName)].includes(key)
              ) {
                // set allowed updates
                // NB: they exclude role and trade
                profile.set(allowedUpdateData);
                profilePromises.push(
                  Promise.all([
                    // save profile
                    profile.save(),
                    // if nextOfKin is updated
                    addOrUpdateNextOfKin(profile, nextOfKin),
                    // if address is updated
                    addOrUpdateAddress(profile, address),
                  ])
                );
              }
            }
            // execute the promises in ||
            await Promise.all(profilePromises);
          }
        }

        return person;
      } catch (e) {
        // console.log('====>', e);
        // Correct thrownBy, and path
        if (['Trade', 'Role'].includes(e.thrownBy) && isAPIError(e)) {
          e.path = e.thrownBy?.toLowerCase();
          e.thrownBy = PersonModel.modelName;
          throw e;
        }
        throw (isCastError(e) && PersonModel.formatCastErrors(e)) || e;
      }
    },
    async deletePerson({ id, deletedBy } = {}) {
      const populateUserData = [
        {
          path: 'profiles',
          populate: ['manager', 'admin', 'trainingOfficer', 'student'].map(
            path => ({
              path,
              populate: [
                'address',
                'modifiedBy',
                'createdBy',
                'trade',
                'role',
                { path: 'nextOfKin', populate: 'address' },
              ],
            })
          ),
        },
      ];

      const populateData = [
        'address',
        'role',
        'trade',
        'createdBy',
        'modifiedBy',
        { path: 'nextOfKin', populate: 'address' },
        { path: 'user', populate: populateUserData },
      ];

      return await this.deleteDocument({
        id,
        deletedBy,
        StorageModel: DeletedPerson,
        populateData,
      });
    },
  });
};
