const generateUniqueId = require('generate-unique-id');
const ObjectId = require('mongoose').Schema.Types.ObjectId;

const Address = require('../address');
const NextOfKin = require('../next-of-kin');
const Trade = require('../trade');
const Role = require('../role');
const DeletedPerson = require('../deleted-person');

const { titles, sex } = require('../../constants/people');
const { addOrUpdateOwned, updateTradeOrRole } = require('../helpers');
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
          trade,
          role,
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
          PersonModel.preventMongo11000({
            nationalId: createData.nationalId,
            email: createData.email,
            phoneNumber: createData.phoneNumber,
          }),
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

        const person = await PersonModel.createDocument(allowedCreateData);

        await Promise.all([
          address?.addOwner(person),
          nextOfKin?.addOwner(person),
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
          if (person.populated('user')) {
            await person.user
              .set({
                sex: person.sex,
                title: person.title,
                firstName: person.firstName,
                lastName: person.lastName,
                phoneNumber: person.phoneNumber,
                email: person.email,
                nationalId: person.nationalId,
              })
              .save();
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
