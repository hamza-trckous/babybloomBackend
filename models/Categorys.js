const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String
  },
  showing: {
    type: Boolean,
    required: false,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

categorySchema.index({ name: 1 });
categorySchema.index({ showing: 1 });
const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
