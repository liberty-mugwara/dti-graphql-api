const mongoose = require('./mongoose');
const personPlugin = require('./plugins/person');

const { Schema, model } = mongoose;
const TOSchema = new Schema();
TOSchema.plugin(personPlugin, { trade: true });

module.exports = model('TrainingOfficer', TOSchema);
