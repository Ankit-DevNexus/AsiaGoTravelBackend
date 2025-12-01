import dotenv from "dotenv";
dotenv.config();

import travelPackageModel from "../models/travelPackageModels.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

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
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

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

    /* ================================
       Parse Packages
    ================================= */
    let parsedPackages;
    try {
      parsedPackages =
        typeof Packages === "string" ? JSON.parse(Packages) : Packages;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid Packages JSON format",
      });
    }

    const pkg = parsedPackages[0];

    /* ================================
       Upload Overview Images
    ================================= */
    let uploadedOverviewImages = [];

    if (req.files?.overviewImages?.length) {
      for (const file of req.files.overviewImages) {
        const result = await uploadOnCloudinary(file.path);

        if (result?.secure_url && result?.public_id) {
          uploadedOverviewImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    }

    /* ================================
       Upload Icons
    ================================= */
    let uploadedIcons = [];

    if (req.files?.icons?.length) {
      for (let i = 0; i < req.files.icons.length; i++) {
        const file = req.files.icons[i];
        const iconMeta = pkg.icons?.[i];

        const result = await uploadOnCloudinary(file.path);

        if (result?.secure_url && result?.public_id) {
          uploadedIcons.push({
            name: iconMeta?.name || file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    }

    /* ================================
       Prepare Package Object
    ================================= */
    const newPackage = {
      subTripCategory: pkg.subTripCategory,
      title: pkg.title,
      location: pkg.location,
      tripDuration: pkg.tripDuration,

      overviewCategory: [
        {
          images: uploadedOverviewImages,
          overview: pkg.overviewCategory?.[0]?.overview,
          itinerary: pkg.overviewCategory?.[0]?.itinerary || [],
          inclusions: pkg.overviewCategory?.[0]?.inclusions || [],
          exclusions: pkg.overviewCategory?.[0]?.exclusions || [],
          summary: pkg.overviewCategory?.[0]?.summary || [],
        },
      ],

      priceDetails: pkg.priceDetails || [],
      rating: pkg.rating ?? 4.8,
      features: pkg.features || [],
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
    const categories = await travelPackageModel.aggregate([
      { $sort: { createdAt: -1 } }, // sort categories

      {
        $addFields: {
          Packages: {
            $sortArray: {
              input: "$Packages",
              sortBy: { createdAt: -1 }, // sort packages
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
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

// export const updateTravelPackage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const setObj = {};

//     // ===== BASIC INFO =====
//     if (req.body.title) {
//       setObj["Packages.$.title"] = req.body.title;
//     }

//     if (req.body.location) {
//       setObj["Packages.$.location"] = req.body.location;
//     }

//     if (req.body.rating) {
//       setObj["Packages.$.rating"] = Number(req.body.rating);
//     }

//     // ===== SUB CATEGORY =====
//     if (req.body.subTripCategoryMain) {
//       setObj["Packages.$.subTripCategory.main"] = req.body.subTripCategoryMain;
//     }

//     // ===== TRIP DURATION =====
//     if (req.body.days) {
//       setObj["Packages.$.tripDuration.days"] = Number(req.body.days);
//     }

//     if (req.body.nights) {
//       setObj["Packages.$.tripDuration.nights"] = Number(req.body.nights);
//     }

//     // ===== FEATURES =====
//     if (req.body.features) {
//       setObj["Packages.$.features"] = JSON.parse(req.body.features);
//     }

//     // ===== PRICE DETAILS =====
//     if (req.body.priceDetails) {
//       setObj["Packages.$.priceDetails"] = JSON.parse(req.body.priceDetails);
//     }

//     // ===== OVERVIEW CATEGORY (TEXT ONLY, SAFE) =====
//     if (req.body.overviewCategory && !req.files?.overviewImages?.length) {
//       setObj["Packages.$.overviewCategory"] = JSON.parse(
//         req.body.overviewCategory
//       );
//     }

//     // ===== OVERVIEW IMAGES (FILES ONLY, SAFE) =====
//     if (req.files?.overviewImages?.length) {
//       setObj["Packages.$.overviewCategory.0.images"] =
//         req.files.overviewImages.map((file) => file.path);
//     }

//     // ===== ICONS (FILES) =====
//     if (req.files?.icons?.length) {
//       setObj["Packages.$.icons"] = req.files.icons.map((file) => ({
//         name: file.originalname,
//         icon: file.path,
//       }));
//     }

//     if (Object.keys(setObj).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided to update",
//       });
//     }

//     const updated = await travelPackageModel.findOneAndUpdate(
//       { "Packages._id": id },
//       { $set: setObj },
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Package not found",
//       });
//     }

//     const updatedPackage = updated.Packages.find(
//       (pkg) => pkg._id.toString() === id
//     );

//     res.status(200).json({
//       success: true,
//       message: "Package updated successfully",
//       data: updatedPackage,
//     });
//   } catch (error) {
//     console.error("Update Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// ----------------------------------------------------------------------------
export const updateTravelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const setObj = {};

    /* ================= FETCH EXISTING PACKAGE ================= */
    const parentDoc = await travelPackageModel.findOne({
      "Packages._id": id,
    });

    if (!parentDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }

    const existingPackage = parentDoc.Packages.find(
      (pkg) => pkg._id.toString() === id
    );

    /* ================= BASIC INFO ================= */
    if (req.body.title) setObj["Packages.$.title"] = req.body.title;

    if (req.body.location) setObj["Packages.$.location"] = req.body.location;

    if (req.body.rating) setObj["Packages.$.rating"] = Number(req.body.rating);

    if (req.body.subTripCategoryMain)
      setObj["Packages.$.subTripCategory.main"] = req.body.subTripCategoryMain;

    if (req.body.days)
      setObj["Packages.$.tripDuration.days"] = Number(req.body.days);

    if (req.body.nights)
      setObj["Packages.$.tripDuration.nights"] = Number(req.body.nights);

    if (req.body.features)
      setObj["Packages.$.features"] = JSON.parse(req.body.features);

    if (req.body.priceDetails)
      setObj["Packages.$.priceDetails"] = JSON.parse(req.body.priceDetails);

    /* ================= OVERVIEW TEXT ================= */
    if (req.body.overviewCategory && !req.files?.overviewImages?.length) {
      setObj["Packages.$.overviewCategory"] = JSON.parse(
        req.body.overviewCategory
      );
    }

    /* ================= OVERVIEW IMAGES ================= */
    if (req.files?.overviewImages?.length) {
      // 🔥 DELETE OLD IMAGES USING STORED publicId
      for (const img of existingPackage.overviewCategory?.[0]?.images || []) {
        if (img.publicId) {
          await deleteFromCloudinary(img.publicId);
        }
      }

      // ✅ UPLOAD NEW IMAGES
      const uploadedImages = [];

      for (const file of req.files.overviewImages) {
        const uploaded = await uploadOnCloudinary(file.path);

        if (uploaded?.secure_url && uploaded?.public_id) {
          uploadedImages.push({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
          });
        }
      }

      setObj["Packages.$.overviewCategory.0.images"] = uploadedImages;
    }

    /* ================= ICONS ================= */
    if (req.files?.icons?.length) {
      // 🔥 DELETE OLD ICONS USING STORED publicId
      for (const icon of existingPackage.icons || []) {
        if (icon.publicId) {
          await deleteFromCloudinary(icon.publicId);
        }
      }

      // ✅ UPLOAD NEW ICONS
      const uploadedIcons = [];

      for (const file of req.files.icons) {
        const uploaded = await uploadOnCloudinary(file.path);

        if (uploaded?.secure_url && uploaded?.public_id) {
          uploadedIcons.push({
            name: file.originalname,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
          });
        }
      }

      setObj["Packages.$.icons"] = uploadedIcons;
    }

    /* ================= NO UPDATE CHECK ================= */
    if (Object.keys(setObj).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates",
      });
    }

    /* ================= UPDATE DB ================= */
    const updated = await travelPackageModel.findOneAndUpdate(
      { "Packages._id": id },
      { $set: setObj },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updated.Packages.find((p) => p._id.toString() === id),
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateTravelPackage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const setObj = {};

//     // Fetch existing package FIRST
//     const parentDoc = await travelPackageModel.findOne({
//       "Packages._id": id,
//     });

//     if (!parentDoc) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Package not found" });
//     }

//     const existingPackage = parentDoc.Packages.find(
//       (pkg) => pkg._id.toString() === id
//     );

//     /* ================= BASIC INFO ================= */
//     if (req.body.title) setObj["Packages.$.title"] = req.body.title;

//     if (req.body.location) setObj["Packages.$.location"] = req.body.location;

//     if (req.body.rating) setObj["Packages.$.rating"] = Number(req.body.rating);

//     if (req.body.subTripCategoryMain)
//       setObj["Packages.$.subTripCategory.main"] = req.body.subTripCategoryMain;

//     if (req.body.days)
//       setObj["Packages.$.tripDuration.days"] = Number(req.body.days);

//     if (req.body.nights)
//       setObj["Packages.$.tripDuration.nights"] = Number(req.body.nights);

//     if (req.body.features)
//       setObj["Packages.$.features"] = JSON.parse(req.body.features);

//     if (req.body.priceDetails)
//       setObj["Packages.$.priceDetails"] = JSON.parse(req.body.priceDetails);

//     /* ================= OVERVIEW TEXT ================= */
//     if (req.body.overviewCategory && !req.files?.overviewImages?.length) {
//       setObj["Packages.$.overviewCategory"] = JSON.parse(
//         req.body.overviewCategory
//       );
//     }

//     /* ================= OVERVIEW IMAGES ================= */
//     if (req.files?.overviewImages?.length) {
//       // 🔥 DELETE OLD OVERVIEW IMAGES
//       existingPackage.overviewCategory?.[0]?.images?.forEach(async (url) => {
//         const publicId = getPublicIdFromUrl(url);
//         await deleteFromCloudinary(publicId);
//       });

//       // ✅ UPLOAD NEW IMAGES
//       const uploadedImages = [];
//       for (const file of req.files.overviewImages) {
//         const uploaded = await uploadOnCloudinary(file.path);
//         if (uploaded?.secure_url) {
//           uploadedImages.push(uploaded.secure_url);
//         }
//       }

//       setObj["Packages.$.overviewCategory.0.images"] = uploadedImages;
//     }

//     /* ================= ICONS ================= */
//     if (req.files?.icons?.length) {
//       // 🔥 DELETE OLD ICONS
//       existingPackage.icons?.forEach(async (icon) => {
//         const publicId = getPublicIdFromUrl(icon.icon);
//         await deleteFromCloudinary(publicId);
//       });

//       // ✅ UPLOAD NEW ICONS
//       const uploadedIcons = [];
//       for (const file of req.files.icons) {
//         const uploaded = await uploadOnCloudinary(file.path);
//         if (uploaded?.secure_url) {
//           uploadedIcons.push({
//             name: file.originalname,
//             icon: uploaded.secure_url,
//           });
//         }
//       }

//       setObj["Packages.$.icons"] = uploadedIcons;
//     }

//     if (Object.keys(setObj).length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No valid updates" });
//     }

//     const updated = await travelPackageModel.findOneAndUpdate(
//       { "Packages._id": id },
//       { $set: setObj },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Package updated successfully",
//       data: updated.Packages.find((p) => p._id.toString() === id),
//     });
//   } catch (error) {
//     console.error("Update Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

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
