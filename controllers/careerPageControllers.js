import { Types } from "mongoose";
import { joinTeamModel } from "../models/joinOurTeamModel.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const JoinOurTeam = async (req, res) => {
  try {
    const { Name, Email, Position, Message } = req.body;

    const cvFile = req.file;

    if (
      !Name.trim() ||
      !Email.trim() ||
      !Position.trim() ||
      !Message.trim() ||
      !cvFile
    ) {
      return res.status(404).json({
        message: "Missing required fields",
        success: false,
      });
    }

    console.log(cvFile);

    var response = await uploadOnCloudinary(cvFile.path);

    if (!response.secure_url || !response.public_id) {
      return res.status(500).json({
        message: "CV not uploaded. Try again!",
        success: false,
      });
    }

    const joinTeamEntry = await joinTeamModel.create({
      Name,
      Email,
      Position,
      Message,
      cv_PublicId: response.public_id,
      cv_SecureUrl: response.secure_url,
    });

    if (!joinTeamEntry) {
      return res.status(500).json({
        message: "Something went wrong while create db entry",
        success: false,
      });
    }

    return res.status(201).json({
      message: "Response submitted",
      success: true,
      response: joinTeamEntry,
    });
  } catch (error) {
    if (response?.public_id) {
      await deleteFromCloudinary(response.public_id);
    }
  }
};

const deleteJoinedTeamRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Id param missing or invalid id",
      });
    }

    const deletedResponse = await joinTeamModel.findByIdAndDelete(id);

    const resp = await deleteFromCloudinary(deletedResponse?.cv_PublicId);

    return res.status(200).json({
      success: true,
      message: "Record deleted",
      resp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const getJoinedTeamRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Id param missing or invalid id",
      });
    }

    const record = await joinTeamModel.findById(id);

    if (!record) {
      return res.status(200).json({
        success: false,
        message: "No record found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Record fetched",
      record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const getJoinedTeamRecords = async (_, res) => {
  try {
    const records = await joinTeamModel.find({});

    return res.status(200).json({
      success: true,
      message: "Records fetched",
      records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

export {
  JoinOurTeam,
  deleteJoinedTeamRecord,
  getJoinedTeamRecordById,
  getJoinedTeamRecords,
};
