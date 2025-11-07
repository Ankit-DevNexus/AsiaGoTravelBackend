import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
    day: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
});

const priceSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["Double", "Triple"],
    },
    originalPrice: {
        type: Number,
        default: 0,
    },
    discountedPrice: {
        type: Number,
        required: true,
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

const categorySchema = new mongoose.Schema({
    main: {
        type: String,
        required: true,
        enum: [
            "Upcoming Group Trips",
            "International Trips",
            "Domestic Trips",
            "Weekend Trips",
            "Backpacking Trips",
            "Corporate Trips"
        ],
    },
    sub: {
        type: String, // e.g., "November 2025" or "Luxury Getaway"
        trim: true,
    },
});

const overviewCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, required: true }, // Cloudinary URL
});

const travelPackageSchema = new mongoose.Schema({
    // Basic Info
    title: {
        type: String, required: true, trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    tripDuration: {
        days: { type: Number, required: true },
        nights: { type: Number, required: true },
    },
    overview: {
        type: String,
        required: true,
        trim: true,
    },

    // Tags (with icons)
    overviewCategoryIcons: [overviewCategorySchema],

    // Images
    images: {
        type: [String],
        required: true
    },

    // Trip Category (Main + Sub)
    tripCategory: categorySchema,

    // Price info
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "USD", //show $ symbol
        required: true
    },
    priceDetails: [priceSchema],

    // filters
    budget: {
        min: {type: Number, default: 0},
        max: {type: Number, defaut: 200000},
    },
    durationInNights: {type: Number},
    rating: { type: Number, default: 4.8 },
    filterTags: [{
        type: String, trim: true
    },],
    famousDestinations: [{type: String, trim : true}],

    pickupDrop: {
        type: String,
        required: true,
        trim: true,
    },

    // Key Features
    features: [
        {
            type: String,
            trim: true,
            required: true,
        },
    ],
    icons: [
        {
            type: String, // Cloudinary URL or local path of the icon image
            required: true,
            trim: true,
        },
    ],
    // discountPrice: { type: Number },

    // Details Tabs
    itinerary: [itinerarySchema],
    inclusions: [{ type: String, trim: true, required: true, }],
    exclusions: [{ type: String, trim: true, required: true, }],
    summary: [{ type: String, trim: true, required: true, }],
    // thingsToPack: [thingsToPackSchema],
    // tags: [{ type: String, trim: true }],

    // Search Details 
    searchDetails: {
        source: { type: String, trim: true },
        destination: { type: String, trim: true },
        departureDate: { type: Date },
        rooms: { type: Number, default: 1 },
        adults: { type: Number, default: 2 },
        children: { type: Number, default: 0 },
        filters: { type: String, trim: true },
    },
    isActive: { type: Boolean, default: true },
},
    { timestamps: true }
);

const travelPackageModel = mongoose.model("travelpackage", travelPackageSchema);
export default travelPackageModel;