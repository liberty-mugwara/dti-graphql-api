const {
  personType,
  updatePersonType,
  createPersonType,
  countPersonType,
} = require('./universal/person');
const { gql } = require('apollo-server-express');

const trainingOfficerResolvers = {
  Query: {
    async trainingOfficer(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async trainingOfficers(_, __, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.listAll({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isTONationalIdAvailable(_, { nationalId }, { dataSources }) {
      return dataSources.TrainingOfficer.isNationalIdAvailable(nationalId, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isTOEmailAvailable(_, { email }, { dataSources }) {
      return dataSources.TrainingOfficer.isEmailAvailable(email, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async trainingOfficerCount(_, { input }, { dataSources }) {
      return await dataSources.TrainingOfficer.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
  },

  Mutation: {
    async updateTrainingOfficer(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.update(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async createTrainingOfficer(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.create(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async deleteTrainingOfficer(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.delete(id, {
        auth: { resolversInfo, requiredRoles: ['manager'] },
      });
    },
  },
};

const trainingOfficerTypes = gql`
  type TrainingOfficer {
    trade: Trade!
    ${personType}
  }

  input UpdateTrainingOfficer {
    ${updatePersonType}
    trade: ID
  }

  input CreateTrainingOfficer {
    ${createPersonType}
    trade: ID!
  }

  input TrainingOfficerCount  {
    ${countPersonType}
    trade: ID
  }

  extend type Query {
    trainingOfficer(id: ID!): TrainingOfficer!
    trainingOfficers: [TrainingOfficer!]!
    isTONationalIdAvailable(nationalId: ID!): Boolean!
    isTOEmailAvailable(email: String!): Boolean!
    trainingOfficerCount(input: TrainingOfficerCount): Int!
  }

  extend type Mutation{
    updateTrainingOfficer(input: UpdateTrainingOfficer): TrainingOfficer!
    createTrainingOfficer(input: CreateTrainingOfficer): TrainingOfficer!
    deleteTrainingOfficer(id: ID!): TrainingOfficer!
  }
`;

module.exports = {
  trainingOfficerTypes,
  trainingOfficerResolvers,
};
