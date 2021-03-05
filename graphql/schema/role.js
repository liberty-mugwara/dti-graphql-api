const { gql } = require('apollo-server-express');
const { objectType } = require('./universal/object');
const { personType } = require('./universal/person');

/* QUERIES */
const roleResolvers = {
  Query: {
    async role(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async roles(_, __, { dataSources }, resolversInfo) {
      return await dataSources.Role.list({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async roleGetManagers(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.getManagers(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async roleCountManagers(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.countManagers(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async roleGetAdmins(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.getAdmins(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async roleCountAdmins(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.countAdmins(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async roleGetAllLinked(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.getAllLinked(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async roleCountAllLinked(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Role.countAllLinked(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async rolesCount(_, { input }, { dataSources }) {
      return await dataSources.Role.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
  },

  Mutation: {
    async createRole(_, { name }, { dataSources }, resolversInfo) {
      return await dataSources.Role.create(
        { name },
        {
          resolversInfo,
          auth: { requiredRoles: ['manager', 'admin'] },
        }
      );
    },

    async deleteRole(
      _,
      { id, roleToReplaceWithId },
      { dataSources },
      resolversInfo
    ) {
      return await dataSources.Role.delete(id, roleToReplaceWithId, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async updateRole(_, { id, name }, { dataSources }, resolversInfo) {
      return await dataSources.Role.update(
        { id, name },
        {
          resolversInfo,
          auth: { requiredRoles: ['manager', 'admin'] },
        }
      );
    },
  },
};

const roleTypes = gql`
  type Role{
    ${objectType}
    name: String!
  }

  type RoleDependant {
    role: Role!
    ${personType}
  }

  input RoleCount  {
    name: String!
  }

  extend type Query{
    role(id: ID!): Role
    roles: [Role!]!
    roleGetManagers(id: ID!):[Manager]!
    roleCountManagers(id: ID!):Int!
    roleGetAdmins(id: ID!):[Admin!]!
    roleCountAdmins(id: ID!):Int!
    roleGetAllLinked(id: ID!): [RoleDependant!]!
    roleCountAllLinked(id: ID!): Int!
    rolesCount(input:RoleCount): Int!
  }

  extend type Mutation{
    createRole(name: String!): Role!
    updateRole(id: ID!, name: String!): Role!
    deleteRole(id: ID!, roleToReplaceWithId: ID!): Role!
  }
  
`;

module.exports = { roleResolvers, roleTypes };
