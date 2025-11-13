import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    featureImage: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    blogContent: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

const blogModel = mongoose.model("blogModel", blogSchema);

export default blogModel;