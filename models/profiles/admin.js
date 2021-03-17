const mongoose = require('../mongoose');
const personPlugin = require('../plugins/person');

const { Schema, model } = mongoose;
const AdminSchema = new Schema();
AdminSchema.plugin(personPlugin, { role: true });

module.exports = model('Admin', AdminSchema);
