const mongoose = require('mongoose');

// mongoose connection --start--
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

const connection = mongoose
  .connect(process.env.DB_URL || '', connectionOptions)
  .catch(console.error);

mongoose.Promise = global.Promise;
mongoose.connection.once('open', _ =>
  console.log(`MongoDb connected on url: ${process.env.DB_URL}`)
);

// mongoose connection --end--

module.exports = connection;
