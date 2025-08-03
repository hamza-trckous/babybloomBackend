// graphql/typeDefs.js
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type ProductGQL {
    id: ID!
    name: String!
    price: Float!
    description: String
  }

  type Query {
    products: [ProductGQL]
  }
`;
module.exports = typeDefs;
