const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { z } = require("zod");
const Category = require("../models/Categorys");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

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
    .optional()
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
  category: z.string()
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
// filtred:/
router.get("/filter", async (req, res) => {
  try {
    const { category, color, size, minPrice, maxPrice, rating, withShipping } =
      req.query;

    // Get category ID from name if category is provided
    let categoryFilter = {};
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        categoryFilter.category = categoryDoc._id;
      }
    }

    const filter = {
      ...categoryFilter
    };

    if (color) {
      const colorArray = color.split(",").map((c) => new RegExp(c, "i"));
      filter.colors = { $in: colorArray };
    }

    if (size) {
      filter.sizes = { $in: size.split(",") };
    }

    if (minPrice) {
      filter.discountedPrice = { $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      filter.discountedPrice = {
        ...filter.discountedPrice,
        $lte: parseFloat(maxPrice)
      };
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    // ✅ Correct shipping filter based on enum
    if (withShipping) {
      const lower = withShipping.toLowerCase();
      if (lower === "yes" || lower === "نعم") {
        filter.withShipping = { $in: ["yes", "نعم"] };
      } else if (lower === "no" || lower === "لا") {
        filter.withShipping = { $in: ["no", "لا"] };
      }
    }

    const products = await Product.find(filter)
      .populate("category", "name description image")
      .sort({ _id: -1 })
      .lean();

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    console.log(category);
    const page = parseInt(req.query.page) || 1; // الصفحة الحالية
    const limit = parseInt(req.query.limit) || 4; // عدد المنتجات في كل صفحة
    const skip = (page - 1) * limit; // عدد المنتجات التي يجب تخطيها
    let principalCategory = await Category.findOne({
      name: "Principal Category"
    });
    if (!principalCategory) {
      principalCategory = await Category.create({
        name: "Principal Category",
        description: "Default principal category",
        image: "/téléchargement (4).jpeg",
        products: []
      });
    }

    let products;
    const totalProducts = await Product.countDocuments({
      category: principalCategory._id
    }); // إجمالي عدد المنتجات

    if (req.query.page && req.query.limit) {
      // منطق جلب المنتجات مع التصفح (pagination)
      products = await Product.find({ category: principalCategory._id })
        .populate("category", "name description image")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      // منطق جلب جميع المنتجات
      products = await Product.find({ category: principalCategory._id })
        .populate("category", "name description image")
        .sort({ _id: -1 })
        .lean();
    }

    res.json({ products, totalProducts });
  } catch (err) {
    console.log(err);
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
  try {
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
      LandingPageContent,
      category
    } = req.body;
    console.log(reviews);

    const imageUrl = await uploadToCloudinary(images);
    const uploadedReviews = await Promise.all(
      (reviews || []).map(async (review) => {
        const uploadedImages = await Promise.all(
          (review.images || []).map(
            async (img) => await uploadToCloudinary(img)
          )
        );
        return {
          text: review.text,
          images: uploadedImages
        };
      })
    );
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const product = new Product({
      name,
      description,
      price,
      colors,
      sizes,
      rating,
      reviews: uploadedReviews,
      images: imageUrl,
      withShipping,
      discountedPrice,
      LandingPageContent,
      category
    });
    existingCategory.products.push(product._id);
    await existingCategory.save();

    const newProduct = await product.save();

    const populatedProduct = await newProduct.populate("category");
    res.status(201).json(populatedProduct);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
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
    category
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
    const uploadedReviews = await Promise.all(
      (reviews || []).map(async (review) => {
        const uploadedImages = await Promise.all(
          (review.images || []).map(
            async (img) => await uploadToCloudinary(img)
          )
        );
        return {
          text: review.text,
          images: uploadedImages
        };
      })
    );
    res.product.reviews = uploadedReviews;
  }
  if (images != null) {
    const uploaded = await uploadToCloudinary(images);
    res.product.images = uploaded;
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
    console.log(err);
    return res.status(500).json({ message: err.message });
  }

  res.product = product;
  next();
}

// Add new PATCH route for landing page updates
router.patch("/:id/landing", async (req, res) => {
  try {
    const { id } = req.params;
    const { LandingPageContent } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $push: { LandingPageContent } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id/landing/:index", async (req, res) => {
  try {
    const { id, index } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $unset: { [`LandingPageContent.${index}`]: 1 }
      },
      { new: true }
    );

    // Remove null values from array
    await Product.findByIdAndUpdate(
      id,
      {
        $pull: { LandingPageContent: null }
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
