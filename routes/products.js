const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { z } = require("zod");

// Define Zod schema for Product
const reviewSchema = z.object({
  text: z.string().min(1, "Review text is required"),
  images: z
    .array(
      z
        .string()
        .regex(
          /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+$/,
          "Invalid base64 string"
        )
        .or(z.string().url())
    )
    .optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.array(reviewSchema).optional(),
  images: z
    .array(
      z
        .string()
        .regex(
          /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+$/,
          "Invalid base64 string"
        )
        .or(z.string().url())
    )
    .optional(),
  withShipping: z.string().optional(),
  discountedPrice: z.number().min(0).optional(),
});

// Middleware to validate request body
const validateProduct = (req, res, next) => {
  try {
    productSchema.parse(req.body);
    next();
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error("Validation error:", e.errors);
      return res.status(400).json({ errors: e.errors });
    }
    console.error("Server error:", e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get a product by ID
// @access  Public
router.get("/:id", getProduct, (req, res) => {
  res.json(res.product);
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Public
router.post("/", validateProduct, async (req, res) => {
  const {
    name,
    description,
    price,
    colors,
    sizes,
    rating,
    reviews,
    images,
    withShipping,
    discountedPrice,
  } = req.body;

  const product = new Product({
    name,
    description,
    price,
    colors,
    sizes,
    rating,
    reviews,
    images,
    withShipping,
    discountedPrice,
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log(err);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product by ID
// @access  Public
router.put("/:id", getProduct, validateProduct, async (req, res) => {
  const {
    name,
    description,
    price,
    colors,
    sizes,
    rating,
    reviews,
    images,
    discountedPrice,
    withShipping,
  } = req.body;

  if (name != null) {
    res.product.name = name;
  }
  if (description != null) {
    res.product.description = description;
  }
  if (price != null) {
    res.product.price = price;
  }
  if (colors != null) {
    res.product.colors = colors;
  }
  if (sizes != null) {
    res.product.sizes = sizes;
  }
  if (rating != null) {
    res.product.rating = rating;
  }
  if (reviews != null) {
    res.product.reviews = reviews;
  }
  if (images != null) {
    res.product.images = images;
  }
  if (discountedPrice != null) {
    res.product.discountedPrice = discountedPrice;
  }
  if (withShipping != null) {
    res.product.withShipping = withShipping;
  }

  try {
    const updatedProduct = await res.product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product by ID
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: "Deleted Product" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get product by ID
async function getProduct(req, res, next) {
  let product;
  try {
    product = await Product.findById(req.params.id);
    if (product == null) {
      return res.status(404).json({ message: "Cannot find product" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.product = product;
  next();
}

module.exports = router;
