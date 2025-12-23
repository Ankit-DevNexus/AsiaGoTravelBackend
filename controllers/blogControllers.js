import dotenv from "dotenv";
dotenv.config();

import blogModel from "../models/blogModels.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

// For debugging only (shows if env vars loaded)
// console.log("Cloudinary config:", {
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.CLOUD_API_KEY,
// });

export const BlogController = async (req, res) => {
  try {
    // console.log("=== BlogController payload ===");
    // console.log("req.body:", req.body);
    // console.log("req.file:", req.file);

    const { title, blogContent, ctaText, author, category } = req.body;

    if (!title || !blogContent || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "Blog image is required",
      });
    }

    // Upload image to Cloudinary
    const uploadedImage = await uploadOnCloudinary(req.file.path);
    if (!uploadedImage || !uploadedImage.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Image upload to Cloudinary failed",
      });
    }

    // Save blog
    const newBlog = await blogModel.create({
      title,
      blogContent,
      featureImage: uploadedImage.secure_url,
      ctaText: ctaText || "Plan your next trip with us ->",
      author: author || "Travel Expert Team",
      category,
    });

    res.status(201).json({
      success: true,
      message: "Blog saved successfully",
      blog: newBlog,
    });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const AllBlogController = async (req, res) => {
  try {
    const blogs = await blogModel.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

export const getBlogByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
      });
    }

    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: err.message,
    });
  }
};

export const BlogImageController = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blogs",
    });

    // Safely remove temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
};

export const EditBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, blogContent, ctaText, author, category } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
      });
    }

    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const updateFields = {};
    if (title?.trim()) updateFields.title = title.trim();
    if (blogContent?.trim()) updateFields.blogContent = blogContent.trim();
    if (ctaText) updateFields.ctaText = ctaText;
    if (author) updateFields.author = author;
    if (category) updateFields.category = category;

    // Replace image if new one uploaded
    if (req.file) {
      const newImagePath = req.file.path;

      // Delete old Cloudinary image
      if (blog.featureImage) {
        try {
          const parts = blog.featureImage.split("/");
          const fileName = parts[parts.length - 1];
          const publicId = `blogs/${fileName.split(".")[0]}`;
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted old Cloudinary image: ${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      const uploadedImage = await cloudinary.uploader.upload(newImagePath, {
        folder: "blogs",
      });
      updateFields.featureImage = uploadedImage.secure_url;

      if (fs.existsSync(newImagePath)) fs.unlinkSync(newImagePath);
    }

    const updatedBlog = await blogModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const DeleteBlogController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
      });
    }

    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Delete image from Cloudinary
    if (blog.featureImage) {
      try {
        const parts = blog.featureImage.split("/");
        const fileName = parts[parts.length - 1];
        const publicId = `blogs/${fileName.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary image: ${publicId}`);
      } catch (err) {
        console.warn("Failed to delete Cloudinary image:", err.message);
      }
    }

    await blogModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
