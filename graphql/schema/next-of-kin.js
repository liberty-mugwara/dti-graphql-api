const { gql } = require('apollo-server-express');
const { objectType } = require('./universal/object');

exports.nextOfKinTypes = gql`
    type NextOfKin {
        firstName: String!
        lastName: String!
        phoneNumber: String!
        relation: String!
        email: String
        sex: Sex!
        address: Address!
        ${objectType}
    }

    input UpdateNextOfKin {
        firstName: String
        lastName: String
        phoneNumber: String
        relation: String
        email: String
        sex: Sex
        address: UpdateAddress
    }

    input CreateNextOfKin {
        firstName: String!
        lastName: String!
        phoneNumber: String!
        relation: String!
        email: String
        sex: Sex
        address: CreateAddress!
    }
`;
