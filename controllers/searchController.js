import travelPackageModel from "../models/travelPackageModels.js";

export const filterTravelPackages = async (req, res) => {
  try {
    const {
      search,
      minBudget,
      maxBudget,
      minNights,
      maxNights,
      type,
      rating,
      famousDestinations, // array
    } = req.query;

    let filters = { isActive: true };

    //  TEXT SEARCH (title, location, destination)
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { "searchDetails.destination": { $regex: search, $options: "i" } },
      ];
    }

    //  BUDGET FILTER (price field OR budget.min/max)
    if (minBudget || maxBudget) {
      filters.price = {
        $gte: Number(minBudget) || 0,
        $lte: Number(maxBudget) || 9999999,
      };
    }

    // Duration (Nights)
    if (minNights || maxNights) {
      filters["tripDuration.nights"] = {
        $gte: Number(minNights) || 0,
        $lte: Number(maxNights) || 100,
      };
    }

    // TYPE FILTER (tripCategory.main)
    if (type) {
      const arr = Array.isArray(type) ? type : [type];
      filters["tripCategory.main"] = { $in: arr };
    }

    // Rating
    if (rating) {
      const arr = Array.isArray(rating) ? rating : [rating];
      filters.rating = { $in: arr.map(Number) };
    }

    // Famous Destinations
    if (famousDestinations) {
      const arr = Array.isArray(famousDestinations)
        ? famousDestinations
        : [famousDestinations];

      filters.famousDestinations = { $in: arr };
    }

    // Fetch results
    const results = await travelPackageModel.find(filters).sort({ price: 1 });

    return res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error applying filters",
      error: error.message,
    });
  }
};
