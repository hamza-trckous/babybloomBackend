const mongoose = require("mongoose");
const Product = require("./models/Product"); // change path accordingly
const fs = require("fs");
const path = require("path");
const Category = require("./models/Categorys");
// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://hamzatricks:LkPfzEYRBxu7E3Jb@cluster0.sjxud.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log("MongoDB connected");
    seedProducts();
  })
  .catch((err) => console.error(err));
const imageFolderPath = path.join(__dirname, "images/4");

// Category ID
// const categoryId = "6844e4caf2422d471b789e19";

async function seedProducts() {
  const imageFilenames = fs.readdirSync(imageFolderPath);
  try {
    const category = await Category.findOne({ name: "Principal Category" });
    console.log(category);
    if (!category) {
      throw new Error("Category not found");
    }
    const categoryId = category._id;
    const base64Images = imageFilenames.map((filename) => {
      const filePath = path.join(imageFolderPath, filename);
      const imageData = fs.readFileSync(filePath);
      const base64 = imageData.toString("base64");
      const mimeType = "image/jpeg"; // or detect dynamically
      return `data:${mimeType};base64,${base64}`;
    });

    const fakeProducts = base64Images.map((img, index) => ({
      name: `Adidas Sneakers Model ${index + 1}`,
      description: `High-quality Adidas sneakers with durable build and unique design.`,
      price: 99.99 + index,
      discountedPrice: 79.99 + index,
      colors: ["Black", "White", "Red"],
      sizes: ["40", "41", "42", "43", "44"],
      withShipping: "yes",
      images: [img],
      category: categoryId,
      LandingPageContent: []
    }));

    const inserted = await Product.insertMany(fakeProducts);
    category.products.push(...inserted.map((p) => p._id));
    await category.save();
    // console.log(`✅ ${inserted.length} products added with base64 images.`);
    // const inserted = await Product.find();
    // console.log(`✅ ${inserted.length} products added successfully.`);
  } catch (error) {
    console.error("❌ Error adding products:", error.message);
  } finally {
    mongoose.disconnect();
  }
}
