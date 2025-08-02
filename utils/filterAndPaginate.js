const Category = require("../models/Categorys");
const Product = require("../models/Product");

const getPrinciplCategory = async () => {
  let category = await Category.findOne({ name: "Principal Category" });
  if (!category) {
    category = await Category.create({
      name: "Principal Category",
      description: "Default principal category",
      image: "/téléchargement (4).jpeg",
      products: []
    });
  }
  return category;
};
const getPagination = async (categoryId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const products = await Product.find({ category: categoryId })
    .populate("category", "name description image")
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const totalProducts = await Product.countDocuments({ category: categoryId });
  return { products, totalProducts };
};
module.exports = { getPrinciplCategory, getPagination };
