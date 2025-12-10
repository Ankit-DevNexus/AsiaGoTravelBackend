import mongoose from "mongoose";
import { Job } from "../models/jobModels.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// CREATE – POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const { title, description, employmentTypes } = req.body;

    if (!title || !description || !employmentTypes) {
      return res.status(400).json({
        success: false,
        message: "title, description and employmentTypes are required",
      });
    }

    if (!Array.isArray(employmentTypes) || employmentTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "employmentTypes must be a non-empty array",
      });
    }

    const job = await Job.create({
      title,
      description,
      employmentTypes,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error("createJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { isActive: true };

    if (type && ["FULL_TIME", "PART_TIME"].includes(type)) {
      filter.employmentTypes = type;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("getAllJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// GET ONE – GET /api/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("getJobById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// UPDATE – PUT /api/jobs/:id
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Job ID",
      });
    }

    const { title, description, employmentTypes, isActive } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (employmentTypes !== undefined) {
      if (!Array.isArray(employmentTypes) || employmentTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "employmentTypes must be a non-empty array",
        });
      }
      updateData.employmentTypes = employmentTypes;
    }

    const job = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("updateJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// DELETE – DELETE /api/jobs/:id
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Job ID",
      });
    }

    const job = await Job.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("deleteJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message,
    });
  }
};
