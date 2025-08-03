const Product = require("../models/Product");

const resolvers = {
  Query: {
    products: async () => {
      return await Product.find();
    }
  }
};

module.exports = resolvers;
