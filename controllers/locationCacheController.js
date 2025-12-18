import axios from "axios";
import locationCacheModel from "../models/LocationCache.js";

export const locationCacheController = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.json([]);

    // Check cache
    const cached = await locationCacheModel.findOne({ query: q });
    if (cached) return res.json(cached.results);

    // Geoapify API Call
    const response = await axios.get(
      "https://api.geoapify.com/v1/geocode/autocomplete",
      {
        params: {
          text: q,
          apiKey: process.env.GEOAPIFY_API_KEY,
          limit: 8
        }
      }
    );

    const results = response.data.features.map(item => ({
      name: item.properties.formatted,
      city: item.properties.city,
      country: item.properties.country,
      lat: item.properties.lat,
      lng: item.properties.lon
    }));

    // Cache Results
    await locationCacheModel.create({ query: q, results });

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Location search failed" });
  }
}

