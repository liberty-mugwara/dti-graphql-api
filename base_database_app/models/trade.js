const mongoose = require('./mongoose');
const { Schema, model } = mongoose;

const TradeSchema = new Schema({
  name: { type: String, required: true, lowercase: true, unique: true },
});

module.exports = model('Trade', TradeSchema);
