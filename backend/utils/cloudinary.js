const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a local file to Cloudinary and return the secure url.
 * Automatically deletes the local file after upload is complete or failed.
 * 
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<string|null>} Secure URL of the uploaded file
 */
const uploadToCloudinary = async (localFilePath, folder = 'admission_system') => {
  try {
    if (!localFilePath) return null;
    
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Delete local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return response.secure_url;
  } catch (error) {
    // Delete local file even if upload fails to prevent leakage
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temporary local file:', unlinkError);
      }
    }
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary, cloudinary };
