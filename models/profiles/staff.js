const mongoose = require('../mongoose');
const personPlugin = require('../plugins/person');

const { Schema, model } = mongoose;
const StaffSchema = new Schema();
StaffSchema.plugin(personPlugin, { role: true });

module.exports = model('Staff', StaffSchema);
