const {
  personType,
  updatePersonType,
  createPersonType,
  countPersonType,
} = require('./universal/person');
const { gql } = require('apollo-server-express');

const adminResolvers = {
  Query: {
    async admin(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Admin.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async admins(_, __, { dataSources }, resolversInfo) {
      return dataSources.Admin.listAll({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isAdminNationalIdAvailable(_, { nationalId }, { dataSources }) {
      return dataSources.Admin.isNationalIdAvailable(nationalId, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isAdminEmailAvailable(_, { email }, { dataSources }) {
      return dataSources.Admin.isEmailAvailable(email, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async adminsCount(_, { input }, { dataSources }) {
      return await dataSources.Admin.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
  },

  Mutation: {
    async updateAdmin(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Admin.update(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager'] },
      });
    },

    async createAdmin(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Admin.create(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager'] },
      });
    },

    async removeAdmin(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Admin.delete(id, {
        auth: { resolversInfo, requiredRoles: ['manager'] },
      });
    },
  },
};

const adminTypes = gql`
  type Admin {
    role: Role!
    ${personType}
  }

  input UpdateAdmin {
    ${updatePersonType}
    role: ID
  }

  input CreateAdmin {
    ${createPersonType}
    role: ID!
  }

  input AdminCount  {
    ${countPersonType}
    role: ID
  }

  extend type Query {
    admin(id: ID!): Admin!
    admins: [Admin!]!
    isAdminNationalIdAvailable(nationalId: ID!): Boolean!
    isAdminEmailAvailable(email: String!): Boolean!
    adminsCount(input: AdminCount): Int!
  }

  extend type Mutation{
    updateAdmin(input: UpdateAdmin): Admin!
    createAdmin(input: CreateAdmin): Admin!
    removeAdmin(id: ID!): Admin!
  }
`;

module.exports = {
  adminTypes,
  adminResolvers,
};
