const express = require("express");
const router = express.Router();
const Category = require("../models/Categorys");
const { z } = require("zod");
const { auth, authorize } = require("../middleware/auth");
const Product = require("../models/Product");

// Define Zod schema for Category
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Category description is required"),
  image: z.string()
});

// Middleware to validate request body
const validateCategory = (req, res, next) => {
  try {
    categorySchema.parse(req.body);
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

// @route   GET /api/categories
// @desc    Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().populate({
      path: "products",
      select: "name rating price discountedPrice images reviews withShipping" // select the fields you want
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
router.post("/", validateCategory, async (req, res) => {
  const { name, description, image } = req.body;
  try {
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   PATCH /api/categories/:id
// @desc    Update a category

router.patch("/:id", async (req, res) => {
  const categoryId = req.params.id;
  const { name, description, image } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    category.name = name;
    category.description = description;
    category.image = image;
    await category.save();
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id/products", async (req, res) => {
  const categoryId = req.params.id;
  const products = await Product.find({ category: categoryId });
  res.status(200).json(products);
});

module.exports = router;
