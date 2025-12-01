import saveKeywordModel from "../models/SearchKeywordModel.js";

export const saveKeywordController = async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ message: "Keyword required" });

    const cleanKeyword = keyword.toLowerCase().trim();

    await saveKeywordModel.findOneAndUpdate(
      { keyword: cleanKeyword },
      {
        $inc: { count: 1 },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Keyword stored in MongoDB successfully",
    });
  } catch (err) {
    console.error("Save keyword error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllKeyword = async (req, res) => {
  try {
    const keyword = await saveKeywordModel.find();

    res.status(200).json({
      message: "fetched successfully",
      keyword,
    });
  } catch (error) {}
};
