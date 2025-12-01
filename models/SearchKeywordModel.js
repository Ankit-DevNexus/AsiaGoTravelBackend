import mongoose from "mongoose";

const searchKeywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const saveKeywordModel = mongoose.model("SearchKeyword", searchKeywordSchema);
export default saveKeywordModel;
