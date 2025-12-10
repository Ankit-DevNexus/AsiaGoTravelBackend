// models/job.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },

    employmentTypes: {
      type: [String],
      // enum: ["FULL_TIME", "PART_TIME"],
      required: true,
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: "At least one employment type is required",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Job = mongoose.model("Job", jobSchema);
