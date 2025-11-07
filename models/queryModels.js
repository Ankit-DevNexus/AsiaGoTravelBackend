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
    }
});

const queryModel = mongoose.model("queryForm", querySchema);
export default queryModel;