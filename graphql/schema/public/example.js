const { gql } = require("apollo-server-express");

/* QUERIES */
const exampleResolvers = {
  Query: {
    async example(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Example.getById(id, {
        resolversInfo,
        auth: { allowAny: true },
      });
    },

    async examples(_, __, { dataSources }, resolversInfo) {
      return await dataSources.Example.list({
        resolversInfo,
        auth: { allowAny: true },
      });
    },

    async examplesCount(_, { input }, { dataSources }) {
      return await dataSources.Example.count(input, {
        auth: { allowAny: true },
      });
    },
  },

  Mutation: {
    async createExample(_, { name }, { dataSources }) {
      return await dataSources.Example.create({ name });
    },

    async deleteExample(_, { id }, { dataSources }) {
      return await dataSources.Example.delete(id);
    },

    async updateExample(_, { id, name }, { dataSources }) {
      return await dataSources.Role.update({ id, name });
    },
  },
};

const exampleTypes = gql`
  type Example {
    _id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  input ExampleCount {
    name: String!
  }

  extend type Query {
    example(id: ID!): Example!
    examples: [Example!]!
    examplesCount(input: ExampleCount): Int!
  }

  extend type Mutation {
    createExample(name: String!): Example!
    updateExample(id: ID!, name: String!): Example!
    deleteExample(id: ID!): Example!
  }
`;

module.exports = { exampleResolvers, exampleTypes };
