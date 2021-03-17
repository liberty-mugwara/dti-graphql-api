const mongoose = require('../mongoose');
const hasOwnersPlugin = require('../plugins/has-owners');

const { Schema, model } = mongoose;

const AddressSchema = new Schema({
  addressLine1: {
    type: String,
    required: [true, '`addressLine1` is required'],
    default: 'Enter Address',
  },
  addressLine2: { type: String },
  city: {
    type: String,
    required: [true, '`city` is required'],
    default: 'Rusape',
  },
  country: {
    type: String,
    required: [true, '`country` is required'],
    default: 'Zimbabwe',
  },
});

AddressSchema.statics = {
  async updateAddress(id, updateData, updateOptions) {
    try {
      const allowedUpdates = [
        'addressLine1',
        'addressLine2',
        'city',
        'country',
      ];
      return await this.updateDocument({
        id,
        updateData,
        allowedUpdates,
        updateOptions,
      });
    } catch (e) {
      throw e;
    }
  },
};

AddressSchema.plugin(hasOwnersPlugin);

module.exports = model('Address', AddressSchema);
