const { gql } = require('apollo-server-express');
const { objectType } = require('./universal/object');
const { personType } = require('./universal/person');

/* QUERIES */
const tradeResolvers = {
  Query: {
    async trade(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async trades(_, __, { dataSources }, resolversInfo) {
      return await dataSources.Trade.list({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async tradeGetTOs(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.getTOs(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async tradeCountTOs(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.countTOs(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async tradeGetStudents(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.getStudents(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async tradeCountStudents(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.countStudents(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async tradeGetAllLinked(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.getAllLinked(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async tradeCountAllLinked(_, { id }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.countAllLinked(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async tradesCount(_, { input }, { dataSources }) {
      return await dataSources.Trade.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
  },

  Mutation: {
    async createTrade(_, { name }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.create(
        { name },
        {
          resolversInfo,
          auth: { requiredRoles: ['manager', 'admin'] },
        }
      );
    },

    async deleteTrade(
      _,
      { id, tradeToReplaceWithId },
      { dataSources },
      resolversInfo
    ) {
      return await dataSources.Trade.delete(id, tradeToReplaceWithId, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async updateTrade(_, { id, name }, { dataSources }, resolversInfo) {
      return await dataSources.Trade.update(
        { id, name },
        {
          resolversInfo,
          auth: { requiredRoles: ['manager', 'admin'] },
        }
      );
    },
  },
};

const tradeTypes = gql`
  type Trade{
    ${objectType}
    name: String!
  }

  type TradeDependant {
    trade: Trade!
    ${personType}
  }

  input TradeCount  {
    name: String!
  }

  extend type Query{
    trade(id: ID!): Trade
    trades: [Trade!]!
    tradeGetTOs(id: ID!):[TrainingOfficer]!
    tradeCountTOs(id: ID!):Int!
    tradeGetStudents(id: ID!):[Student!]!
    tradeCountStudents(id: ID!):Int!
    tradeGetAllLinked(id: ID!): [TradeDependant!]!
    tradeCountAllLinked(id: ID!): Int!
    tradesCount(input:TradeCount): Int!
  }

  extend type Mutation{
    createTrade(name: String!): Trade!
    updateTrade(id: ID!, name: String!): Trade!
    deleteTrade(id: ID!, tradeToReplaceWithId: ID!): Trade!
  }
  
`;

module.exports = { tradeResolvers, tradeTypes };
