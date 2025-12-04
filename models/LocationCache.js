import mongoose from "mongoose";

const locationCacheSchema = new mongoose.Schema(
  {
    query: { type: String, index: true },
    results: Array
  },
  { timestamps: true }
);

const locationCacheModel = mongoose.model("LocationCache", locationCacheSchema);
export default locationCacheModel;