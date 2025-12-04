import express from "express";
import upload from "../middleware/multer.js";
import {
  createTravelPackage,
  deleteTravelPackage,
  getAllTravelPackageById,
  getAllTravelPackages,
  updateTravelPackage,
} from "../controllers/travelPackageControllers.js";
import { submitContactUs } from "../controllers/contactUsControllers.js";
import { submitQueryForm } from "../controllers/queryControllers.js";
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  syncGoogleReviews,
  updateTestimonial,
} from "../controllers/testimonialsControllers.js";
import {
  AllBlogController,
  BlogController,
  BlogImageController,
  DeleteBlogController,
  EditBlogController,
  getBlogByIdController,
} from "../controllers/blogControllers.js";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
} from "../controllers/userControllers.js";
import { protect } from "../middleware/authMiddleware.js";
import { filterTravelPackages } from "../controllers/searchController.js";

import { suggestionController } from "../controllers/searchController.js";
import {
  getAllKeyword,
  saveKeywordController,
} from "../controllers/savekeywordController.js";
import { locationCacheController } from "../controllers/locationCacheController.js";

const router = express.Router();

// router.use("/auth", authRoutes);
router.post(
  "/addPackage",
  upload.fields([
    { name: "overviewImages", maxCount: 10 },
    { name: "icons", maxCount: 10 },
  ]),
  createTravelPackage
);

router.get("/allPackage", getAllTravelPackages);

router.get("/allPackage/:id", getAllTravelPackageById);
router.patch(
  "/package/update/:id",
  // protect,
  upload.fields([
    { name: "overviewImages", maxCount: 10 },
    { name: "icons", maxCount: 10 },
  ]),
  updateTravelPackage
);
router.delete("/package/delete/:id", deleteTravelPackage);

router.post("/contact-us", submitContactUs);

// Query Form
router.post("/submitQuery", submitQueryForm);

// Testimonials
router.post("/create-Testimonials", upload.single("image"), createTestimonial);

router.get("/allTestimonials", getAllTestimonials);

router.get("/testimonial/:id", getTestimonialById);

router.patch(
  "/testimonial/update/:id",
  upload.single("image"),
  updateTestimonial
);

router.delete("/testimonial/delete/:id", deleteTestimonial);

router.get("/sync-google", syncGoogleReviews);

// Blog Controllers
router.post(
  "/blogPost",
  protect,
  upload.single("featureImage"),
  BlogController
);

router.get("/allBlog", AllBlogController);

router.get("/allBlog/:id", getBlogByIdController);

router.post(
  "/upload-image",
  upload.single("featureImage"),
  BlogImageController
);

router.patch(
  "/blog/edit/:id",
  protect,
  upload.single("featureImage"),
  EditBlogController
);

router.delete("/blog/delete/:id", protect, DeleteBlogController);

// Auth Routes
router.post("/signup", registerUser);
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// --------------------------- Search  ----------------------------
router.get("/travel/filter", filterTravelPackages);

router.get(
  "/suggestions",
  // protect,
  suggestionController
);
// save keyword to DB
router.post("/saveKeyword", saveKeywordController);
router.get("/saveKeyword", getAllKeyword);


// location cache

router.get("/location/search", locationCacheController);

export default router;
