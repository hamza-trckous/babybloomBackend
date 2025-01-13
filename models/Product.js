const mongoose = require("mongoose");

// Define Review sub-schema
const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Define Product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      min: 0,
    },
    colors: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    withShipping: {
      type: String,
      enum: ["نعم", "لا"],
      required: true,
    },
  },
  { timestamps: true }
);

// Create and export Product model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
