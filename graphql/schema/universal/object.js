exports.objectType = `
  _id: ID!
  modifiedBy: User
  createdBy: User
  createdAt: String!
  updatedAt: String!
`;

exports.objectTypeLoose = `
  _id: ID
  modifiedBy: UserLoose
  createdBy: UserLoose
  createdAt: String
  updatedAt: String
`;
