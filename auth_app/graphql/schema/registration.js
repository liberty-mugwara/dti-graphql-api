const { gql } = require('apollo-server-express');
const { APIGraphqlError, errorCodeMap } = require('../../../errors');
const {
  generateRegToken,
  generateAccessToken,
  validateRegTokenData,
} = require('../auth');

// REGISTRATION
const registrationResolvers = {
  Mutation: {
    async startRegistration(_, { nationalId }, { dataSources }) {
      // see if user is already registered and not deleted
      const isRegistered = await dataSources.User.registerUserExists({
        nationalId,
      });
      if (isRegistered) return { isRegistered };

      const [
        [profile],
        [profileName],
      ] = await dataSources.User.model.getProfiles(nationalId);

      if (!profile) {
        throw new APIGraphqlError(
          errorCodeMap.get(404),
          'The provided national id is not associated with any account.'
        );
      }

      const { firstName, lastName } = profile;

      // generate registrationToken
      const token = generateRegToken(profileName, profile._id, nationalId);

      return {
        isRegistered: false,
        firstName,
        lastName,
        token,
        question: `Enter RVC for your ${profileName} account.`,
      };
    },

    /* verifyRegistration */
    async verifyRegistration(
      _,
      { RVC: providedRVC },
      { dataSources, regUser: tokenData }
    ) {
      // user must have token to answer security question
      const { _id, nationalId, isVerified, profile } = validateRegTokenData(
        tokenData
      );

      if (isVerified) {
        throw new APIGraphqlError(
          errorCodeMap.get(403),
          'You are already verified go on and enter your credentials'
        );
      }

      const [__, { firstName, lastName, RVC } = {}] = await Promise.all([
        dataSources.User.registerUserExists({ nationalId, throwError: true }),
        dataSources[profile]?.getById(_id, { authorize: false }),
      ]);

      if (!firstName && !lastName && !RVC) {
        throw new APIGraphqlError(
          errorCodeMap.get(404),
          'Profile not found. It might have been deleted.' +
            ' Restarting the registration process might help.'
        );
      }

      //   check if rvc is correct
      if (RVC !== providedRVC.trim())
        throw new APIGraphqlError(errorCodeMap.get(400), 'Invalid RVC!');

      // generate registrationToken
      const token = generateRegToken(profile, _id, nationalId, true);

      return {
        token,
        isVerified: true,
      };
    },

    /* registerUser */
    async registerUser(
      _,
      { password, password2 },
      { regUser: tokenData, dataSources },
      resolversInfo
    ) {
      // user must have token to answer security question
      const { nationalId, isVerified } = validateRegTokenData(tokenData);

      if (!isVerified) {
        throw new APIGraphqlError(
          errorCodeMap.get(403),
          'You are not verified!'
        );
      }

      await dataSources.User.registerUserExists({
        nationalId,
        throwError: true,
      });

      //   check if passwords match
      if (password !== password2)
        throw new APIGraphqlError(
          errorCodeMap.get(400),
          'Passwords do not match'
        );

      const newUser = await dataSources.User.model
        .createUser({
          nationalId,
          password,
        })
        .catch(e => {
          if (e?.code === 404) {
            throw new APIGraphqlError(
              errorCodeMap.get(404),
              'Profile not found. It might have been deleted.' +
                ' Restarting the registration process might help.'
            );
          }
          throw e;
        });

      await dataSources.User.populateDocument(
        dataSources.User.getPopulateDataFromInfo(resolversInfo, 1),
        newUser
      );

      return await generateAccessToken(newUser);
    },
  },
};

const registrationTypes = gql`
  type StartRegistration {
    firstName: String
    lastName: String
    isRegistered: Boolean!
    question: String
    token: String
  }

  type VerifyRegistration {
    isVerified: Boolean!
    token: String!
  }

  extend type Mutation {
    startRegistration(nationalId: ID!): StartRegistration!
    verifyRegistration(RVC: String!): VerifyRegistration!
    registerUser(password: String!, password2: String!): Auth!
  }
`;

module.exports = {
  registrationResolvers,
  registrationTypes,
};
