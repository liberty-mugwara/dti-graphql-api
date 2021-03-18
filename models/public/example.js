// This model is for testing purposes

const mongoose = require("../mongoose");
const { Schema, model } = mongoose;

const ExampleSchema = new Schema({
  name: { type: String, required: true, lowercase: true, unique: true },
});

module.exports = model("Example", ExampleSchema);
