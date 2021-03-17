const mongoose = require('../mongoose');
const personPlugin = require('../plugins/person');

const { Schema, model } = mongoose;
const ManagerSchema = new Schema();
ManagerSchema.plugin(personPlugin, { role: true });

module.exports = model('Manager', ManagerSchema);
