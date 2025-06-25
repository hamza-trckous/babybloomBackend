const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadToCloudinary = async (images) => {
  try {
    if (Array.isArray(images)) {
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (img.startsWith("http")) return img; // Already uploaded
          const res = await cloudinary.uploader.upload(img, {
            folder: "mystore/categories",
            transformation: [{ width: 1200, height: 630, crop: "fill" }]
          });
          return res.secure_url;
        })
      );
      return uploadedImages;
    } else {
      if (images.startsWith("http")) return images; // Already uploaded
      const res = await cloudinary.uploader.upload(images, {
        folder: "mystore/categories",
        transformation: [{ width: 1200, height: 630, crop: "fill" }]
      });
      return res.secure_url;
    }
  } catch (err) {
    throw new Error("فشل رفع الصورة إلى Cloudinary");
  }
};

module.exports = uploadToCloudinary;
