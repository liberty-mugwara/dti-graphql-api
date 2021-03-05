const mongoose = require('./mongoose');
const { convertTZ } = require('../../helpers/date');

const { Schema, model } = mongoose;

const deletedPersonSchema = new Schema({
  deletedBy: {},
  deletedAt: { type: Date, default: convertTZ(new Date(), 'Africa/Harare') },
  deleted: {},
});

module.exports = model('DeletedPerson', deletedPersonSchema);
