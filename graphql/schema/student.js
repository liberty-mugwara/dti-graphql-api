const {
  personType,
  updatePersonType,
  createPersonType,
  countPersonType,
} = require('./universal/person');
const { gql } = require('apollo-server-express');

const studentResolvers = {
  Query: {
    async student(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Student.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async students(_, __, { dataSources }, resolversInfo) {
      return dataSources.Student.listAll({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isStudentNationalIdAvailable(_, { nationalId }, { dataSources }) {
      return dataSources.Student.isNationalIdAvailable(nationalId, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
    async isStudentEmailAvailable(_, { email }, { dataSources }) {
      return dataSources.Student.isEmailAvailable(email, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async studentsCount(_, { input }, { dataSources }) {
      return await dataSources.Student.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },
  },

  Mutation: {
    async updateStudent(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Student.update(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async createStudent(_, { input }, { dataSources }, resolversInfo) {
      return dataSources.Student.create(input, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async removeStudent(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.Student.delete(id, {
        auth: { resolversInfo, requiredRoles: ['manager'] },
      });
    },
  },
};

const studentTypes = gql`
  type Student {
    role: Role!
    ${personType}
  }

  input UpdateStudent {
    ${updatePersonType}
    role: ID
  }

  input CreateStudent {
    ${createPersonType}
    role: ID!
  }

  input StudentCount  {
    ${countPersonType}
    role: ID
  }

  extend type Query {
    student(id: ID!): Student!
    students: [Student!]!
    isStudentNationalIdAvailable(nationalId: ID!): Boolean!
    isStudentEmailAvailable(email: String!): Boolean!
    studentsCount(input: StudentCount): Int!
  }

  extend type Mutation{
    updateStudent(input: UpdateStudent): Student!
    createStudent(input: CreateStudent): Student!
    removeStudent(id: ID!): Student!
  }
`;

module.exports = {
  studentTypes,
  studentResolvers,
};
