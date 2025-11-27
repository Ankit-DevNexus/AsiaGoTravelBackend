import dotenv from "dotenv";
dotenv.config();

import travelPackageModel from "../models/travelPackageModels.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Helper function to safely parse JSON
// const parseIfString = (value) => {
//   try {
//     return typeof value === "string" ? JSON.parse(value) : value;
//   } catch {
//     return value;
//   }
// };

// CREATE TRAVEL PACKAGE
// export const createTravelPackage = async (req, res) => {
//   try {
//     const { tripCategory, Packages } = req.body;

//     // Validate tripCategory
//     if (!tripCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "tripCategory is required",
//       });
//     }

//     // Validate Packages array
//     if (!Array.isArray(Packages) || Packages.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Packages array is required",
//       });
//     }

//     // Take first package (current API design)
//     const pkg = Packages[0];

//     // Construct exactly as per schema (no mutation)
//     const newPackage = {
//       subTripCategory: pkg.subTripCategory,
//       title: pkg.title,
//       location: pkg.location,
//       tripDuration: pkg.tripDuration,
//       overviewCategory: pkg.overviewCategory,
//       priceDetails: pkg.priceDetails,
//       durationInNights: pkg.durationInNights,
//       rating: pkg.rating,
//       features: pkg.features,
//       icons: pkg.icons,
//       isActive: pkg.isActive ?? true,
//     };

//     // Find category
//     let category = await travelPackageModel.findOne({ tripCategory });

//     if (!category) {
//       // Create NEW category with package
//       category = await travelPackageModel.create({
//         tripCategory,
//         Packages: [newPackage],
//       });
//     } else {
//       // Push package into existing category
//       category.Packages.push(newPackage);
//       await category.save();
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Package saved successfully",
//       data: newPackage,
//     });
//   } catch (error) {
//     console.error("Create package error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const createTravelPackage = async (req, res) => {
  try {
    const { tripCategory, Packages } = req.body;

    if (!tripCategory) {
      return res.status(400).json({
        success: false,
        message: "tripCategory is required",
      });
    }

    if (!Packages) {
      return res.status(400).json({
        success: false,
        message: "Packages is required",
      });
    }

    // Parse Packages (sent as JSON string)
    let parsedPackages;

    try {
      parsedPackages =
        typeof Packages === "string" ? JSON.parse(Packages) : Packages;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid Packages JSON format",
      });
    }

    const pkg = parsedPackages[0];

    /* ================================
    Upload Overview Images
    ================================= */
    let uploadedImages = [];

    if (req.files?.overviewImages) {
      for (const file of req.files.overviewImages) {
        const uploadResult = await uploadOnCloudinary(file.path);
        if (uploadResult?.secure_url) {
          uploadedImages.push(uploadResult.secure_url);
        }
      }
    }

    /* ================================
     Upload Icons
    ================================= */
    let uploadedIcons = [];

    // if (req.files?.icons && Array.isArray(pkg.icons)) {
    //   for (let i = 0; i < req.files.icons.length; i++) {
    //     const file = req.files.icons[i];
    //     const iconMeta = pkg.icons[i]; // { name }

    //     const uploadResult = await uploadOnCloudinary(file.path);

    //     if (uploadResult?.secure_url) {
    //       uploadedIcons.push({
    //         name: iconMeta?.name || "icon",
    //         icon: uploadResult.secure_url,
    //       });
    //     }
    //   }
    // }
    if (req.files?.icons) {
      for (let i = 0; i < req.files.icons.length; i++) {
        const file = req.files.icons[i];
        const iconMeta = pkg.icons?.[i];

        const uploadResult = await uploadOnCloudinary(file.path);

        if (uploadResult?.secure_url) {
          uploadedIcons.push({
            name: iconMeta?.name ?? file.originalname,
            icon: uploadResult.secure_url,
          });
        }
      }
    }

    /* ================================
    Prepare package object
    ================================= */
    const newPackage = {
      subTripCategory: pkg.subTripCategory,
      title: pkg.title,
      location: pkg.location,
      tripDuration: pkg.tripDuration,

      overviewCategory: [
        {
          images: uploadedImages,
          overview: pkg.overviewCategory?.[0]?.overview,
          itinerary: pkg.overviewCategory?.[0]?.itinerary || [],
          inclusions: pkg.overviewCategory?.[0]?.inclusions || [],
          exclusions: pkg.overviewCategory?.[0]?.exclusions || [],
          summary: pkg.overviewCategory?.[0]?.summary || [],
        },
      ],

      priceDetails: pkg.priceDetails,
      rating: pkg.rating,
      features: pkg.features,
      icons: uploadedIcons,
      isActive: pkg.isActive ?? true,
    };

    /* ================================
    Save to MongoDB
    ================================= */
    let category = await travelPackageModel.findOne({ tripCategory });

    if (!category) {
      category = await travelPackageModel.create({
        tripCategory,
        Packages: [newPackage],
      });
    } else {
      category.Packages.push(newPackage);
      await category.save();
    }

    return res.status(201).json({
      success: true,
      message: "Travel package created successfully",
      data: newPackage,
    });
  } catch (error) {
    console.error("Create package error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET ALL PACKAGES

export const getAllTravelPackages = async (req, res) => {
  try {
    const categories = await travelPackageModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories, // contains tripCategory + Packages[]
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

    const category = await travelPackageModel.findOne({
      "Packages._id": id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }

    const travelPackage = category.Packages.find(
      (pkg) => pkg._id.toString() === id
    );

    res.status(200).json({
      success: true,
      data: travelPackage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const updateTravelPackage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = { ...req.query, ...req.body };

//     if (!updates || Object.keys(updates).length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No update data provided" });
//     }

//     const existingPackage = await travelPackageModel.findById(id);
//     if (!existingPackage) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Package not found" });
//     }

//     // Handle new uploads
//     const uploadFiles = async (files) => {
//       if (!files || files.length === 0) return [];
//       const uploaded = await Promise.all(
//         files.map((file) => uploadOnCloudinary(file.path))
//       );
//       return uploaded.map((img) => img.secure_url);
//     };

//     const newImages = await uploadFiles(req.files?.images);
//     const newIcons = await uploadFiles(req.files?.icons);
//     const newOverviewIcons = await uploadFiles(
//       req.files?.overviewCategoryIcons
//     );

//     const allowedFields = [
//       "title",
//       "location",
//       "tripDuration",
//       "overview",
//       "tripCategory",
//       "overviewCategoryIcons",
//       "price",
//       "currency",
//       "pickupDrop",
//       "features",
//       "itinerary",
//       "inclusions",
//       "exclusions",
//       "summary",
//       "priceDetails",
//       "tags",
//       "isActive",
//       "searchDetails",
//       "budget",
//       "durationInNights",
//       "rating",
//       "famousDestinations",
//       "filterTags",
//     ];

//     const filteredUpdates = Object.keys(updates)
//       .filter((key) => allowedFields.includes(key))
//       .reduce((obj, key) => {
//         obj[key] = parseIfString(updates[key]);
//         return obj;
//       }, {});

//     if (newImages.length > 0) filteredUpdates.images = newImages;
//     if (newIcons.length > 0) filteredUpdates.icons = newIcons;

//     if (filteredUpdates.overviewCategoryIcons) {
//       const parsedCategories =
//         parseIfString(filteredUpdates.overviewCategoryIcons) || [];
//       filteredUpdates.overviewCategoryIcons = parsedCategories.map(
//         (cat, index) => ({
//           name: cat.name || cat,
//           icon: newOverviewIcons[index] || cat.icon || "",
//         })
//       );
//     }

//     const updatedPackage = await travelPackageModel.findByIdAndUpdate(
//       id,
//       { $set: filteredUpdates },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Package updated successfully",
//       data: updatedPackage,
//     });
//   } catch (error) {
//     console.error("Update Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// DELETE PACKAGE

export const updateTravelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await travelPackageModel.findOneAndUpdate(
      { "Packages._id": id },
      {
        $set: Object.keys(updates).reduce((acc, key) => {
          acc[`Packages.$.${key}`] = updates[key];
          return acc;
        }, {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }

    const updatedPackage = updated.Packages.find(
      (pkg) => pkg._id.toString() === id
    );

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTravelPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await travelPackageModel.findOneAndUpdate(
      { "Packages._id": id },
      { $pull: { Packages: { _id: id } } },
      { new: true }
    );

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }

    res.status(200).json({
      success: true,
      message: "Travel package deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
