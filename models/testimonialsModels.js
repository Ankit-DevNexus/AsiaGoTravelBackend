import mongoose from "mongoose";

const testimonialsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    packageName: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // date: {
    //     type: Date,
    //     default: Date.now,
    // },
    image: {
        type: String,
        default: "",
    },
}, {
    timestamps: true
});

const testimonialModel = mongoose.model("Testimonial", testimonialsSchema);
export default testimonialModel;