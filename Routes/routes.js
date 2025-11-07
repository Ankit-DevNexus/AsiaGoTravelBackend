import express from "express";
import { upload, svgUpload } from "../middleware/multer.js";
import { createTravelPackage, deleteTravelPackage, getAllTravelPackageById, getAllTravelPackages, updateTravelPackage } from "../controllers/travelPackageControllers.js";
import { submitContactUs } from "../controllers/contactUsControllers.js";
import { submitQueryForm } from "../controllers/queryControllers.js";

const router = express.Router();

router.post("/addPackage", upload.fields([
  { name: "images", maxCount: 10 },
  { name: "icons", maxCount: 10 },
  {name: "overviewCategoryIcons", maxCount: 10},
]), createTravelPackage);
router.get("/allPackage", getAllTravelPackages);
router.get("/allPackage/:id", getAllTravelPackageById);
router.patch("/update/:id",upload.fields([
    { name: "images", maxCount: 10 },
    { name: "thingsToPackIcons", maxCount: 10 },
    {name: "overviewCategoryIcons", maxCount: 10}
  ]), updateTravelPackage);
router.delete("/delete/:id", deleteTravelPackage);


router.post("/contact-us", submitContactUs);

// Query Form
router.post("/submitQuery", submitQueryForm);

export default router;