import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    numberOfTravellers: {
        type: Number,
        required: true
    },
    monthOfTravel: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },

    // ✅ new fields
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "travelPackage", // your travel package model name
        required: false,
    },
    packageTitle: { type: String }, // optional for quick admin viewing
});

const queryModel = mongoose.model("queryForm", querySchema);
export default queryModel;