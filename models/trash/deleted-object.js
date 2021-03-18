const mongoose = require('../mongoose');
const { convertTZ } = require('../../helpers/date');

const { Schema, model } = mongoose;

const deletedObjectSchema = new Schema({
  deletedBy: {},
  deletedAt: { type: Date, default: convertTZ(new Date(), 'Africa/Harare') },
  deleted: {},
});

module.exports = model('DeletedObject', deletedObjectSchema);
