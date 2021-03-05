const mongoose = require('mongoose');
const models = require('./models');

// mongoose connection --start--
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

mongoose
  .connect(process.env.DB_URL || '', connectionOptions)
  .catch(console.error);

mongoose.Promise = global.Promise;
mongoose.connection.once('open', _ =>
  console.log(`MongoDb connected on url: ${process.env.DB_URL}`)
);

// mongoose connection --end--

// helper functions
const syncIndexes = async () => {
  try {
    for (const [_, model] of Object.entries(models)) {
      await model.syncIndexes();
      console.log(model.modelName + ' indexes synced');
    }
  } catch (e) {
    console.error(e);
  }
};

const applyNewDefaults = async () => {
  // apply newly added default values to existing docs
  // if the value was undefined
  try {
    let loaders = ['#', '.', '>'],
      nextLoader = 0,
      modelName = '',
      count = 0;
    for (const [_, model] of Object.entries(models)) {
      if (model.modelName !== modelName) {
        modelName = model.modelName;
        nextLoader++;
      }
      const docs = await model.find();
      await Promise.all(
        docs.map(async doc => {
          try {
            await doc.save();
            count++;
            process.stdout.write(loaders[nextLoader % 3]);
          } catch (e) {
            throw e;
          }
        })
      );
    }
    console.log('\n');
    console.log('='.repeat(22));
    console.log('DONE  '.repeat(4));
    console.log(count + ' Documents saved!');
    console.log('='.repeat(22));
  } catch (e) {
    console.error(e);
  }
};

// applyNewDefaults();

// syncIndexes();

module.exports = {
  ...models,
  syncIndexes,
  applyNewDefaults,
  models,
};
