import { model, Schema } from "mongoose";

const joinTeamSchema = new Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
    },
    Position: {
      type: String,
      required: true,
    },
    cv_PublicId: {
      type: String,
      required: true,
    },
    cv_SecureUrl: {
      type: String,
      required: true,
    },
    Message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const joinTeamModel = model("joinTeamApplictions", joinTeamSchema);

export { joinTeamModel };
