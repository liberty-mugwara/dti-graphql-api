const mongoose = require('mongoose');
const plugins = require('../plugins/global');

mongoose.plugin(plugins.errorHandlerPlugin);
mongoose.plugin(plugins.mutationsByPlugin);
mongoose.plugin(plugins.checkAllowedUpdatesPlugin);
mongoose.plugin(plugins.documentHandlerPlugin);
mongoose.plugin(plugins.modelNamePlugin);
mongoose.plugin(plugins.timestampsPlugin);

module.exports = mongoose;
