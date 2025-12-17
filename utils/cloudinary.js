// import pkg from "cloudinary";
// import fs from 'fs';
// import dotenv from 'dotenv';
// dotenv.config();

// const { v2: cloudinary } = pkg;

// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.CLOUD_API_KEY,
//     api_secret: process.env.CLOUD_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: 'auto',
//             timeout: 12000,
//         });
//         console.log("File uploaded to cloudinary:", response.secure_url);
//         await fs.promises.unlink(localFilePath);
//         return response;
//     } catch (error) {
//         console.error("Error uploading to cloudinary", error);
//         if(fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);
//         return null;
//     }
// };

// const deleteFromCloudinary = async (publicId) => {
//     try {
//         const response = await cloudinary.uploader.destroy(publicId, {
//             resource_type: 'auto',
//         });
//         console.log("File deleted from cloudinary:", response);
//         return response;
//     } catch (error) {
//         console.error("error deleting file form cloudinary", error);
//         return null;
//     }
// };

// export {uploadOnCloudinary, deleteFromCloudinary};

import pkg from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const { v2: cloudinary } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const stats = fs.statSync(localFilePath);
    const fileSize = stats.size;
    const maxSize = 10 * 1024 * 1024; // 10 MB Cloudinary free limit
    let fileToUpload = localFilePath;

    // Compress if file > 10 MB
    if (fileSize > maxSize) {
      const compressedPath = `compressed-${Date.now()}.jpg`;
      await sharp(localFilePath)
        .resize({ width: 1920 }) // scale down to 1920 px width
        .jpeg({ quality: 80 }) // 80 % quality
        .toFile(compressedPath);
      fileToUpload = compressedPath;
      console.log("Image compressed before upload:", compressedPath);
    }

    // Upload
    const response = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
      timeout: 20000,
      folder: "travel-packages",
    });

    // console.log("File uploaded to Cloudinary:", response.secure_url);

    // Delete local temp files
    await fs.promises.unlink(localFilePath);
    if (fileToUpload !== localFilePath && fs.existsSync(fileToUpload)) {
      await fs.promises.unlink(fileToUpload);
    }

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);
    return null;
  }
};



const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    // console.log("File deleted from Cloudinary:", response);
    return response;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
