const mongoose = require('mongoose');

const Address = require('./address');

const hasOwnersPlugin = require('./plugins/has-owners');
const { titles, sex } = require('../constants/people');
const { addOwned, addOrUpdateOwned } = require('./helpers');

const { Schema, model } = mongoose;
const addAddress = addOwned(Address);
const addOrUpdateAddress = addOrUpdateOwned(Address);

const NextOfKinSchema = new Schema({
  firstName: {
    type: String,
    required: [true, '`firstName` is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, '`lastName` is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    // optional and unique email
    index: { unique: true, sparse: true },
  },
  phoneNumber: { type: String, trim: true, required: true },
  sex: { type: String, enum: sex, default: 'male' },
  title: { type: String, enum: titles, default: 'other' },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  relation: {
    type: String,
    trim: true,
    required: true,
    default: 'Enter relation',
  },
});

NextOfKinSchema.post('save', async function () {
  if (!this?.address) {
    await addAddress(this, { city: 'Rusape' });
    await this.save();
  }
});

NextOfKinSchema.pre('remove', async function () {
  await this.populate('address').execPopulate();
  if (this.populated('address')) await this.address.removeOwner(this);
});

NextOfKinSchema.statics = {
  async createNextOfKin(createData) {
    // defined out of try block for the catch block to access this variable
    const NextOfKinModel = this;

    try {
      const { address: addressData, ...allowedCreateData } = createData || {};

      // validate input
      await Promise.all([NextOfKinModel.validate(allowedCreateData)]);

      const promises = [];
      // create address if provided
      if (addressData) promises.push(Address.createDocument(addressData));
      const [address] = await Promise.all(promises);

      if (address) allowedCreateData.address = address._id;

      const nok = await NextOfKinModel.createDocument(allowedCreateData);

      await address?.addOwner(nok);
      return nok;
    } catch (e) {
      // Correct thrownBy, and path
      if (isAPIError(e)) {
        e.path = e.thrownBy?.toLowerCase();
        e.thrownBy = PersonModel.modelName;
        throw e;
      }

      // handle other errors
      throw (isCastError(e) && NextOfKinModel.formatCastErrors(e)) || e;
    }
  },

  async updateNextOfKin(id, updateData, updateOptions) {
    try {
      const { address, modifiedBy, ...restData } = updateData;

      // validate input
      await this.preventMongo11000({
        email: updateData.email,
        phoneNumber: updateData.phoneNumber,
      });
      const mongo11000Keys = ['email', 'phoneNumber'];
      const allowedUpdates = [
        'dob',
        'email',
        'firstName',
        'lastName',
        'nationalId',
        'phoneNumber',
        'relation',
        'sex',
        'title',
      ];

      const nextOfKin = await this.updateDocument({
        id,
        updateData: { ...restData, modifiedBy },
        allowedUpdates,
        mongo11000Keys,
        updateOptions,
      });

      // update address
      if (address) {
        await addOrUpdateAddress(nextOfKin, address);
        return await nextOfKin.save();
      }
    } catch (e) {
      throw e;
    }
  },
};

NextOfKinSchema.plugin(hasOwnersPlugin);

module.exports = model('NextOfKin', NextOfKinSchema);
