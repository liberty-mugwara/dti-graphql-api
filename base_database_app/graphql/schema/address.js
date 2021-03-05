const { gql } = require('apollo-server-express');
const { objectType } = require('./universal/object');

exports.addressTypes = gql`
    type Address {
        addressLine1: String!
        addressLine2: String
        city: String!
        country: String!
        ${objectType}
    }
    
    input UpdateAddress {
        id: ID
        addressLine1: String
        addressLine2: String
        city: String
        country: String
    }

    input CreateAddress {
        addressLine1: String!
        addressLine2: String
        city: String!
        country: String!
    }
`;
