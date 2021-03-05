const { gql } = require('apollo-server-express');
const { objectType, objectTypeLoose } = require('./universal/object');

exports.userResolvers = {
  Query: {
    async me(_, __, { dataSources, user }, resolversInfo) {
      return dataSources.User.getById(user?._id, { resolversInfo, auth: {} });
    },

    async myActionsCount(_, { input }, { dataSources, user }) {
      return await dataSources.User.countActions(
        { ...input, userId: user?._id },
        {
          auth: {
            requiredRoles:
              input.userId === user?.id ? [] : ['manager', 'admin'],
          },
        }
      );
    },

    async user(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.User.getById(id, {
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async users(_, __, { dataSources }, resolversInfo) {
      return dataSources.User.list({
        resolversInfo,
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async usersCount(_, { input }, { dataSources }) {
      return await dataSources.User.count(input, {
        auth: { requiredRoles: ['manager', 'admin'] },
      });
    },

    async userActionsCount(_, { input }, { dataSources, user }) {
      return await dataSources.User.countActions(input, {
        auth: {
          requiredRoles: input.userId === user?.id ? [] : ['manager', 'admin'],
        },
      });
    },
  },

  Mutation: {
    async deleteUser(_, { id }, { dataSources }, resolversInfo) {
      return dataSources.User.delete(id, {
        auth: { resolversInfo, requiredRoles: ['manager'] },
      });
    },
  },
};

exports.userTypes = gql`
    type Profiles {
        admin: Admin
        manager: Manager
        student: Student
        trainingOfficer: TrainingOfficer
    }

    type UserLoose {
      firstName: String
      lastName: String
      nationalId: String
      email: String
      phoneNumber: String
      sex: Sex
      title: Title
      isManager: Boolean
      isAdmin: Boolean
      isTrainingOfficer: Boolean
      isStudent: Boolean
      isActive: Boolean
      scope: String
      profiles: Profiles
      ${objectTypeLoose}
  }

    type User {
        firstName: String!
        lastName: String!
        nationalId: String!
        email: String
        phoneNumber: String
        sex: Sex!
        title: Title!
        isManager: Boolean!
        isAdmin: Boolean!
        isTrainingOfficer: Boolean!
        isStudent: Boolean!
        isActive: Boolean!
        scope: String!
        profiles: Profiles!
        ${objectType}
    }

    input UserCount {
      firstName: String
      lastName: String
      nationalId: String
      email: String
      phoneNumber: String
      sex: Sex
      title: Title
      isManager: Boolean
      isAdmin: Boolean
      isTrainingOfficer: Boolean
      isStudent: Boolean
      isActive: Boolean
      scope: String
      modifiedBy: ID
      createdBy: ID
      createdAt: String
      updatedAt: String
    }

    input UserFilter{
      sex: Sex
      title: Title
      isManager: Boolean
      isAdmin: Boolean
      isTrainingOfficer: Boolean
      isStudent: Boolean
      isActive: Boolean
    }

    input ActionFilter {
      objectType: ObjectType!
      filter: UserFilter
    }

    input UserActions {
      userId: ID!
      actionType: ActionType!
      filter: ActionFilter
    }

    input MyActions {
      actionType: ActionType!
      filter: ActionFilter
    }

    extend type Query {
      me:User!
      user(id: ID!):User!
      users:[User!]!
      usersCount(input: UserCount): Int!
      userActionsCount(input: UserActions!): Int!
      myActionsCount(input: MyActions!): Int!
    }

    extend type Mutation {
      deleteUser(id: ID!): User!
    }
`;
