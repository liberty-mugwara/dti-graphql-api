const {
  personType,
  updatePersonType,
  createPersonType,
  countPersonType,
} = require("./universal/person");
const { gql } = require("apollo-server-express");

const managerResolvers = {
  Query: {
    async manager(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Manager.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ["manager", "admin"] },
      });
    },

    async managers(_, __, { dataSources, user, regUser }, resolversInfo) {
      console.log(user, regUser);
      return dataSources.Manager.listAll({
        resolversInfo,
        auth: { requiredRoles: ["manager", "admin"] },
      });
    },
    async isManagerNationalIdAvailable(_, { nationalId }, { dataSources }) {
      return dataSources.Manager.isNationalIdAvailable(nationalId, {
        auth: { requiredRoles: ["manager", "admin"] },
      });
    },
    async isManagerEmailAvailable(_, { email }, { dataSources }) {
      return dataSources.Manager.isEmailAvailable(email, {
        auth: { requiredRoles: ["manager", "admin"] },
      });
    },

    async managersCount(_, { input }, { dataSources }) {
      return await dataSources.Manager.count(input, {
        auth: { requiredRoles: ["manager", "admin"] },
      });
    },
  },

  Mutation: {
    async updateManager(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Manager.update(input, {
        resolversInfo,
        auth: { requiredRoles: ["manager"] },
      });
    },

    async createManager(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Manager.create(input, {
        resolversInfo,
        auth: { requiredRoles: ["manager"], allowAny: true },
      });
    },

    async deleteManager(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Manager.delete(id, {
        auth: { resolversInfo, requiredRoles: ["manager"] },
      });
    },
  },
};

const managerTypes = gql`
  type Manager {
    role: Role!
    ${personType}
  }

  input UpdateManager {
    ${updatePersonType}
    role: ID
  }

  input CreateManager {
    ${createPersonType}
    role: ID!
  }

  input ManagerCount  {
    ${countPersonType}
    role: ID
  }

  extend type Query {
    manager(id: ID!): Manager!
    managers: [Manager!]!
    isManagerNationalIdAvailable(nationalId: ID!): Boolean!
    isManagerEmailAvailable(email: String!): Boolean!
    managersCount(input: ManagerCount): Int!
  }

  extend type Mutation{
    updateManager(input: UpdateManager): Manager!
    createManager(input: CreateManager): Manager!
    deleteManager(id: ID!): Manager!
  }
`;

module.exports = {
  managerTypes,
  managerResolvers,
};
