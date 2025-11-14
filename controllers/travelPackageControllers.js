import dotenv from "dotenv";
dotenv.config();
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import travelPackageModel from "../models/travelpackagemodels.js";

// Helper function to safely parse JSON
const parseIfString = (value) => {
    try {
        return typeof value === "string" ? JSON.parse(value) : value;
    } catch {
        return value;
    }
};

// CREATE TRAVEL PACKAGE
export const createTravelPackage = async (req, res) => {
    try {
        const {
            title,
            location,
            tripDuration,
            overview,
            tripCategory,
            price,
            currency,
            pickupDrop,
            features,
            itinerary,
            inclusions,
            exclusions,
            summary,
            priceDetails,
            tags,
            isActive,
            searchDetails,
            durationInNights,
            rating,
            famousDestinations,
            budget,
            overviewCategoryIcons,
            filterTags,
        } = req.body;

        // Upload main images
        let imageUrls = [];
        if (req.files?.images?.length > 0) {
            const uploaded = await Promise.all(
                req.files.images.map(async (file) => {
                    const result = await uploadOnCloudinary(file.path);
                    return result?.secure_url || null;
                })
            );
            imageUrls = uploaded.filter(Boolean);
        }

        // Upload feature icons
        let iconUrls = [];
        if (req.files?.icons?.length > 0) {
            const uploadedIcons = await Promise.all(
                req.files.icons.map(async (file) => {
                    const result = await uploadOnCloudinary(file.path);
                    return result?.secure_url || null;
                })
            );
            iconUrls = uploadedIcons.filter(Boolean);
        }

        // Upload overview category icons
        let overviewIcons = [];
        if (req.files?.overviewCategoryIcons?.length > 0) {
            const uploadedOverviewIcons = await Promise.all(
                req.files.overviewCategoryIcons.map(async (file) => {
                    const result = await uploadOnCloudinary(file.path);
                    return result?.secure_url || null;
                })
            );
            overviewIcons = uploadedOverviewIcons.filter(Boolean);
        }

        // Build overview categories array
        const parsedOverviewCategoryIcons = parseIfString(overviewCategoryIcons) || [];
        const finalOverviewCategoryIcons = parsedOverviewCategoryIcons.map((cat, index) => ({
            name: cat.name || cat,
            icon: overviewIcons[index] || cat.icon || "",
        }));

        // Create new travel package
        const newPackage = await travelPackageModel.create({
            title,
            location,
            tripDuration: parseIfString(tripDuration),
            overview,
            tripCategory: parseIfString(tripCategory),
            overviewCategoryIcons: finalOverviewCategoryIcons,
            price,
            currency,
            pickupDrop,
            features: parseIfString(features),
            itinerary: parseIfString(itinerary),
            inclusions: parseIfString(inclusions),
            exclusions: parseIfString(exclusions),
            summary: parseIfString(summary),
            priceDetails: parseIfString(priceDetails),
            tags: parseIfString(tags),
            isActive,
            searchDetails: parseIfString(searchDetails),
            images: imageUrls,
            icons: iconUrls,
            durationInNights,
            rating,
            famousDestinations: parseIfString(famousDestinations),
            budget: parseIfString(budget),
            filterTags: parseIfString(filterTags),
        });

        res.status(201).json({
            success: true,
            message: "✅ Travel Package Created Successfully!",
            data: newPackage,
        });
    } catch (error) {
        console.error("Error creating travel package:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ GET ALL PACKAGES
export const getAllTravelPackages = async (req, res) => {
    try {
        const { mainCategory,
            subCategory,
            minBudget,
            maxBudget,
            minNights,
            maxNights,
            minRating,
            maxRating,
            tag,
            search, } = req.query;
        const filter = {};

        if (mainCategory) filter["tripCategory.main"] = mainCategory;
        if (subCategory) filter["tripCategory.sub"] = subCategory;
        if (tag) filter.filterTags = { $regex: tag, $options: "i" };
        if (minRating || maxRating)
            filter.rating = {
                ...(minRating ? { $gte: Number(minRating) } : {}),
                ...(maxRating ? { $lte: Number(maxRating) } : {}),
            };
        if (minBudget || maxBudget)
            filter["budget.max"] = {
                ...(minBudget ? { $gte: Number(minBudget) } : {}),
                ...(maxBudget ? { $lte: Number(maxBudget) } : {}),
            };
        if (minNights || maxNights)
            filter.durationInNights = {
                ...(minNights ? { $gte: Number(minNights) } : {}),
                ...(maxNights ? { $lte: Number(maxNights) } : {}),
            };
        if (search)
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { overview: { $regex: search, $options: "i" } },
            ];

        const packages = await travelPackageModel.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: packages.length,
            data: packages,
        });
    } catch (error) {
        console.error("Get All Packages Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET PACKAGE BY ID
export const getAllTravelPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const travelPackage = await travelPackageModel.findById(id);
        if (!travelPackage) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }
        res.status(200).json({ success: true, data: travelPackage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTravelPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.query, ...req.body };

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No update data provided" });
        }

        const existingPackage = await travelPackageModel.findById(id);
        if (!existingPackage) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        // Handle new uploads
        const uploadFiles = async (files) => {
            if (!files || files.length === 0) return [];
            const uploaded = await Promise.all(files.map((file) => uploadOnCloudinary(file.path)));
            return uploaded.map((img) => img.secure_url);
        };

        const newImages = await uploadFiles(req.files?.images);
        const newIcons = await uploadFiles(req.files?.icons);
        const newOverviewIcons = await uploadFiles(req.files?.overviewCategoryIcons);

        const allowedFields = [
            "title", "location", "tripDuration", "overview", "tripCategory", "overviewCategoryIcons",
            "price", "currency", "pickupDrop", "features", "itinerary", "inclusions",
            "exclusions", "summary", "priceDetails", "tags", "isActive", "searchDetails",
            "budget", "durationInNights", "rating", "famousDestinations", "filterTags"
        ];

        const filteredUpdates = Object.keys(updates)
            .filter((key) => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = parseIfString(updates[key]);
                return obj;
            }, {});

        if (newImages.length > 0) filteredUpdates.images = newImages;
        if (newIcons.length > 0) filteredUpdates.icons = newIcons;

        if (filteredUpdates.overviewCategoryIcons) {
            const parsedCategories = parseIfString(filteredUpdates.overviewCategoryIcons) || [];
            filteredUpdates.overviewCategoryIcons = parsedCategories.map((cat, index) => ({
                name: cat.name || cat,
                icon: newOverviewIcons[index] || cat.icon || "",
            }));
        }

        const updatedPackage = await travelPackageModel.findByIdAndUpdate(
            id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "✅ Package updated successfully",
            data: updatedPackage,
        });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE PACKAGE
export const deleteTravelPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await travelPackageModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }
        res.status(200).json({
            success: true,
            message: "✅ Travel package deleted successfully!",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
