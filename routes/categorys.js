const express = require("express");
const router = express.Router();
const Category = require("../models/Categorys");
const { z } = require("zod");
const { auth, authorize } = require("../middleware/auth");
const Product = require("../models/Product");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const redisClient = require("../redis/client");

// Define Zod schema for Category
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Category description is required"),
  image: z.string(),
  showing: z.boolean().optional() // <-- ✅ Add this
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
    const cacheKey = "catefories:all";
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }
    const categories = await Category.find({ showing: true });
    const results = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ category: cat._id }).limit(4);

        return { ...cat.toObject(), products };
      })
    );

    await redisClient.setEx(cacheKey, 600, JSON.stringify(results));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// @desc    Get One categorie

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
router.post(
  "/",
  validateCategory,
  auth,
  authorize(["admin"]),
  async (req, res) => {
    const { name, description, image, showing } = req.body;
    try {
      const imageUrl = await uploadToCloudinary(image);
      const category = new Category({
        name,
        description,
        image: imageUrl,
        showing
      });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

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

router.patch("/:id", auth, authorize(["admin"]), async (req, res) => {
  const categoryId = req.params.id;
  const { name, description, image, showing } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) {
      if (image.startsWith("data:image") || image.startsWith("blob:")) {
        const uploadedImage = await uploadToCloudinary(image);
        category.image = uploadedImage;
      } else {
        category.image = image;
      }
    }
    if (showing !== undefined) category.showing = showing;

    await category.save();
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/:id/products", async (req, res) => {
  const categoryId = req.params.id;

  try {
    // 1. جرب تجيب البيانات من الكاش
    const cached = await redisClient.get(`category:${categoryId}:products`);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 2. ما في كاش؟ جيب البيانات من قاعدة البيانات
    const products = await Product.find({ category: categoryId });

    // 3. خزنها في الكاش لمدة مثلاً 5 دقائق (300 ثانية)
    await redisClient.set(
      `category:${categoryId}:products`,
      JSON.stringify(products),
      "EX",
      300
    );

    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});
// Backend route: GET /api/category/:id/products?page=1&limit=4
router.get("/:id/productsWithPagination", async (req, res) => {
  const categoryId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;

  try {
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find({ category: categoryId }).skip(skip).limit(limit),
      Product.countDocuments({ category: categoryId })
    ]);

    res.status(200).json({
      products,
      totalProducts
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});
module.exports = router;
