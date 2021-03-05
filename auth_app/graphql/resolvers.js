const { registrationResolvers } = require('./schema/registration');
const { authResolvers } = require('./schema/auth');
const { userResolvers } = require('./schema/user');

module.exports = [registrationResolvers, authResolvers, userResolvers];
