const mongoose = require('../mongoose');
const personPlugin = require('../plugins/person');

const { Schema, model } = mongoose;
const StudentSchema = new Schema();
StudentSchema.plugin(personPlugin, { trade: true });

module.exports = model('Student', StudentSchema);
