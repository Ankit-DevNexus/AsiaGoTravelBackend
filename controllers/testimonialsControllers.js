import testimonialModel from "../models/testimonialsModels.js";
import fetch from "node-fetch";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const createTestimonial = async (req, res) => {
    try {
        const { name, packageName, message, rating, date, image } = req.body;
        if (!name || !packageName || !message || !rating) {
            return res.status(400).json({
                success: false, message: "All required fields are needed"
            });
        }

        let imageUrl = "";

        // If image is uploaded, send to Cloudinary
        if (req.file) {
            const uploadResult = await uploadOnCloudinary(req.file.path);
            imageUrl = uploadResult.secure_url || uploadResult.url;
        }

        const testimonial = await testimonialModel.create({
            name,
            packageName,
            message,
            rating,
            date,
            image: imageUrl,
        });
        res.status(201).json({
            success: true,
            message: "manual testimonial added successfully",
            date: testimonial,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating testimonial", error: error.message });
    }
};

export const getAllTestimonials = async (req, res) => {
    try {
        const testimonails = await testimonialModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: testimonails.length, data: testimonails });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching testimonials",
            error: error.message
        });
    }
};

export const syncGoogleReviews = async (req, res) => {
    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        const PLACE_ID = process.env.PLACE_ID;

        if (!GOOGLE_API_KEY || !PLACE_ID) {
            return res.status(400).json({
                success: false,
                message: "Missing Google API key or Place ID in environment variables",
            });
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.result || !data.result.reviews) {
            return res.status(400).json({ success: false, message: "No Google review found" });
        }

        const googleReviews = data.result.reviews.map((r) => ({
            name: r.author_name,
            packageName: "Google Review",
            message: r.text,
            rating: r.rating,
            date: new Date(),
            image: r.profile_photo_url || "",
        }));

        // 🧠 Save / update unique Google reviews
        for (const review of googleReviews) {
            await testimonialModel.findOneAndUpdate(
                { name: review.name, message: review.message },
                review,
                { upsert: true, new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: `✅ Synced ${googleReviews.length} Google Reviews successfully`,
            data: googleReviews,
        });
    } catch (error) {
        console.error("❌ Error syncing Google reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch Google reviews",
            error: error.message,
        });
    }
};