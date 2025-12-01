import travelPackageModel from "../models/travelPackageModels.js";
import {
  getKeywordSuggestions,
  saveKeyword,
} from "../services/redisServices.js";

export const filterTravelPackages = async (req, res) => {
  try {
    const {
      search,
      tripCategory,
      subTripCategory,
      title,
      location,
      minBudget,
      maxBudget,
      minNights,
      maxNights,
      rating,
      famousDestinations,
    } = req.query;

    const pipeline = [];

    // Unwind Packages
    pipeline.push({ $unwind: "$Packages" });

    // Base Condition
    const match = {
      "Packages.isActive": true,
    };

    //  Trip Category
    if (tripCategory) {
      match.tripCategory = tripCategory; // InternationalTrips / DomesticTrips
    }

    //  Sub Trip Category
    if (subTripCategory) {
      match["Packages.subTripCategory.main"] = subTripCategory;
    }

    //  Title Search
    if (title) {
      match["Packages.title"] = { $regex: title, $options: "i" };
    }

    //  Location Search
    if (location) {
      match["Packages.location"] = { $regex: location, $options: "i" };
    }

    //  Global Search (Search bar)
    if (search) {
      match.$or = [
        { "Packages.title": { $regex: search, $options: "i" } },
        { "Packages.location": { $regex: search, $options: "i" } },
        { "Packages.subTripCategory.main": { $regex: search, $options: "i" } },
        { "Packages.features": { $regex: search, $options: "i" } },
      ];
    }

    //  Duration (Nights)
    if (minNights || maxNights) {
      match["Packages.tripDuration.nights"] = {
        $gte: Number(minNights) || 0,
        $lte: Number(maxNights) || 100,
      };
    }

    //  Budget Filter (priceDetails)
    if (minBudget || maxBudget) {
      pipeline.push({
        $addFields: {
          minPrice: {
            $min: "$Packages.priceDetails.discountedPrice",
          },
        },
      });

      match.minPrice = {
        $gte: Number(minBudget) || 0,
        $lte: Number(maxBudget) || 9999999,
      };
    }

    // Rating
    if (rating) {
      match["Packages.rating"] = { $gte: Number(rating) };
    }

    //  Famous Destinations
    if (famousDestinations) {
      const arr = Array.isArray(famousDestinations)
        ? famousDestinations
        : [famousDestinations];

      match["Packages.location"] = { $in: arr };
    }

    //  APPLY MATCH
    pipeline.push({ $match: match });

    //  CLEAN RESPONSE
    pipeline.push({
      $project: {
        tripCategory: 1,
        Packages: 1,
      },
    });

    const results = await travelPackageModel.aggregate(pipeline);

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

export const suggestionController = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.json({ suggestions: [] });

    //  Redis (fastest)
    const redisSuggestions = await getKeywordSuggestions(keyword);
    if (redisSuggestions.length >= 5) {
      return res.json({ suggestions: redisSuggestions.slice(0, 10) });
    }

    const regex = new RegExp(`^${keyword}`, "i");

    // Mongo suggestions from travel packages
    const dbResults = await travelPackageModel.aggregate([
      { $unwind: "$Packages" },
      {
        $match: {
          $or: [
            { "Packages.title": regex },
            { "Packages.location": regex },
            { "Packages.subTripCategory.main": regex },
            { "Packages.features": regex },
          ],
        },
      },
      {
        $project: {
          suggestion: {
            $ifNull: ["$Packages.title", "$Packages.location"],
          },
        },
      },
      { $limit: 10 },
    ]);

    const dbSuggestions = dbResults.map((r) => r.suggestion);

    // enough results? stop early
    if (redisSuggestions.length + dbSuggestions.length >= 5) {
      return res.json({
        suggestions: [
          ...new Set([...redisSuggestions, ...dbSuggestions]),
        ].slice(0, 10),
      });
    }

    // AI fallback
    let aiSuggestions = [];
    if (keyword.length > 3) {
      const aiResult = await generateText(`
        Generate related travel package keywords for: "${keyword}".
        Return ONLY 8 comma separated keywords.
      `);

      aiSuggestions = aiResult
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    const finalSuggestions = [
      ...new Set([...redisSuggestions, ...dbSuggestions, ...aiSuggestions]),
    ];

    return res.json({ suggestions: finalSuggestions.slice(0, 10) });
  } catch (err) {
    console.error("Suggestion error:", err.message);
    res.json({ suggestions: [] });
  }
};

export const searchKeywordController = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ message: "Keyword required" });

    // save keyword for suggestions
    await saveKeyword(keyword);

    // redis suggestions
    const redisSuggestions = await getKeywordSuggestions(keyword);

    // AI keyword expansion (spell + semantic)
    const aiResult = await generateText(`${keyword}`);
    const parsedAi = aiResult
      .replace(/\*/g, "")
      .replace(/\n/g, "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const mainKeyword = parsedAi[0] || keyword;
    const regex = new RegExp(mainKeyword, "i");

    // Mongo Aggregation
    const results = await travelPackageModel.aggregate([
      { $unwind: "$Packages" },

      { $match: { "Packages.isActive": true } },

      {
        $match: {
          $or: [
            { tripCategory: regex },
            { "Packages.title": regex },
            { "Packages.location": regex },
            { "Packages.subTripCategory.main": regex },
            { "Packages.features": regex },
            { "Packages.overviewCategory.overview": regex },
            { "Packages.overviewCategory.summary": regex },
            { "Packages.overviewCategory.itinerary.title": regex },
            {
              "Packages.overviewCategory.itinerary.description": regex,
            },
          ],
        },
      },

      {
        $project: {
          tripCategory: 1,
          Packages: 1,
        },
      },

      { $limit: 50 },
    ]);

    res.json({
      entered: keyword,
      aiSuggestions: parsedAi,
      redisSuggestions,
      searchKeywordUsed: mainKeyword,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
