const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath) => {
  try {
    if (!filePath) {
      return null;
    }
    const result = await cloudinary.uploader.upload(filePath, {
      // folder: 'your_folder_name',
      folder: "udhyog-saath",
      resource_type: "auto",
      overwrite: true,
      unique_filename: false,
      use_filename: true,
    });
    await fs.promises.unlink(filePath);
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error.message);
    await fs.promises.unlink(filePath);
    return null;
  }
};

const deleteImage = async (fileUrl) => {
  try {
    if (!fileUrl) {
      return null;
    }
    const publicId = fileUrl.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    console.log(`Image with public ID ${publicId} deleted successfully.`);
    return true;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error.message);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
