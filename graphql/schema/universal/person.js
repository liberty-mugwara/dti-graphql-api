const { gql } = require('apollo-server-express');
const { objectType } = require('./object');

exports.personType = `
    user: User
    firstName: String!
    lastName: String!
    nationalId: String!
    dob: String
    email: String
    phoneNumber: String
    sex: Sex!
    title: Title!
    address: Address!
    nextOfKin: NextOfKin!
    """
    RVC: Registration Verification Code
    """
    RVC: String!
    relation: String
    ${objectType}
`;

exports.createPersonType = `
firstName: String!
lastName: String!
nationalId: String!
phoneNumber: String!
address: CreateAddress!
nextOfKin: CreateNextOfKin!
dob: String
email: String
sex: Sex
title: Title
`;

exports.updatePersonType = `
id: ID!
firstName: String
lastName: String
nationalId: String
phoneNumber: String
address: UpdateAddress
nextOfKin: UpdateNextOfKin
dob: String
email: String
sex: Sex
title: Title
`;

exports.countPersonType = `
_id: ID
firstName: String
lastName: String
nationalId: String
phoneNumber: String
address: UpdateAddress
nextOfKin: UpdateNextOfKin
dob: String
email: String
sex: Sex
title: Title
`;

exports.personTypes = gql`
  type Person {
    firstName: String!
    lastName: String!
    nationalId: String!
    dob: String
    email: String
    phoneNumber: String
    sex: Sex!
    title: Title!
    address: Address!
    nextOfKin: NextOfKin!
    RVC: String!
    relation: String
    ${objectType}
  }
`;
