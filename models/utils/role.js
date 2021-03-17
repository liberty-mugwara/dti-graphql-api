const mongoose = require('../mongoose');
const { Schema, model } = mongoose;

const RoleSchema = new Schema({
  name: { type: String, required: true, lowercase: true, unique: true },
});

exports.RoleSchema = RoleSchema;
module.exports = model('Role', RoleSchema);
