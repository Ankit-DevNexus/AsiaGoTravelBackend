import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String },
    publicId: { type: String },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema({
  day: { type: String },
  title: { type: String },
  description: [{ type: String }],
});

const overviewCategorySchema = new mongoose.Schema({
  // Images with publicId
  images: [imageSchema],

  overview: {
    type: String,
    trim: true,
  },

  // Details Tabs
  itinerary: [itinerarySchema],
  inclusions: [{ type: String, trim: true }],
  exclusions: [{ type: String, trim: true }],
  summary: [{ type: String, trim: true }],
});

const priceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Double", "Triple"],
  },
  originalPrice: {
    type: String,
    default: 0,
  },
  discountedPrice: {
    type: String,
  },
  currency: {
    type: String,
    default: "$",
  },
  note: {
    type: String,
    trim: true,
    default: "Per Person",
  },
});

const subCategorySchema = new mongoose.Schema({
  main: {
    type: String,
  },
});

const iconSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    url: { type: String },
    publicId: { type: String },
  },
  { _id: false }
);

const travelPackageSchema = new mongoose.Schema(
  {
    // Trip Category (Main + Sub)
    subTripCategory: subCategorySchema,
    tripDuration: {
      days: { type: Number },
      nights: { type: Number },
    },
    // Basic Info
    title: {
      type: String,

      trim: true,
    },
    location: {
      type: String,

      trim: true,
    },

    // Tags (with icons)
    overviewCategory: [overviewCategorySchema],

    priceDetails: [priceSchema],

    // durationInNights: { type: Number },
    rating: { type: Number, default: 4.8 },

    // Key Features
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    // Icons with publicId
    icons: [iconSchema],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const tripCategorySchema = new mongoose.Schema(
  {
    tripCategory: {
      type: String,
      enum: ["InternationalTrips", "DomesticTrips", "test"],
    },
    Packages: [travelPackageSchema],
  },
  { timestamps: true }
);

const travelPackageModel = mongoose.model("travelpackage", tripCategorySchema);
export default travelPackageModel;
