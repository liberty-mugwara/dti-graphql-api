const { gql } = require('apollo-server-express');
const { generateAccessToken } = require('../auth');

const authResolvers = {
  Mutation: {
    async login(
      _,
      { nationalId, phoneNumber, password },
      { dataSources },
      resolversInfo
    ) {
      // this throws well
      return await generateAccessToken(
        // one can use either (nationalId + password) or (phoneNumber + password)
        await dataSources.User.authenticate(
          { nationalId, phoneNumber, password },
          {
            resolversInfo,
            level: 1,
          }
        )
      );
    },

    async logout(_, __, { dataSources, token, revokeTokenData }) {
      // revoking token is available even if token has expired
      const dbUser = await dataSources.User.model.findById(
        revokeTokenData?._id
      );
      dbUser.jwts.pull(token);
      await dbUser.save();
      return { id: dbUser._id, success: true };
    },
  },
};

const authTypes = gql`
  type Auth {
    user: User!
    token: String!
  }

  type Logout {
    id: ID!
    success: Boolean!
  }

  extend type Mutation {
    logout: Logout!
    login(nationalId: ID, phoneNumber: String, password: String!): Auth!
  }
`;

module.exports = {
  authResolvers,
  authTypes,
};
