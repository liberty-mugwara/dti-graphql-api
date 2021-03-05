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

    async trainingOfficer(_, __, { dataSources }, resolversInfo) {
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

    async removeTrainingOfficer(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.TrainingOfficer.delete(id, {
        auth: { resolversInfo, requiredRoles: ['manager'] },
      });
    },
  },
};

const trainingOfficerTypes = gql`
  type TrainingOfficer {
    role: Role!
    ${personType}
  }

  input UpdateTrainingOfficer {
    ${updatePersonType}
    role: ID
  }

  input CreateTrainingOfficer {
    ${createPersonType}
    role: ID!
  }

  input TrainingOfficerCount  {
    ${countPersonType}
    role: ID
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
    removeTrainingOfficer(id: ID!): TrainingOfficer!
  }
`;

module.exports = {
  trainingOfficerTypes,
  trainingOfficerResolvers,
};
