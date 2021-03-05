const { gql } = require('apollo-server-express');
const { registrationTypes } = require('./schema/registration');
const { authTypes } = require('./schema/auth');
const { userTypes } = require('./schema/user');

module.exports = [registrationTypes, authTypes, userTypes];
