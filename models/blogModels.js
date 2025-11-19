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
    ctaText: {
        type: String,
        default: "Plan your next trip with us ->",
    },
    author: {
        type: String,
        default: "Travel Expert Team",
    },
    category: {
        type: String,
        required: true,
        enum: [
            "Travel Tips",
            "Destination Guides",
            "Budget Travel",
            "Seasonal Trips",
            "Inspiration Stories",
        ],
    }
}, {
    timestamps: true
});

const blogModel = mongoose.model("blogModel", blogSchema);

export default blogModel;