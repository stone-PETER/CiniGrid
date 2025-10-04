import express from "express";
import { Client } from "@googlemaps/google-maps-services-js";

const router = express.Router();
const mapsClient = new Client({});

/**
 * Proxy endpoint for Google Places photos
 * This avoids exposing the API key in frontend and handles CORS
 */
router.get("/place-photo", async (req, res) => {
  try {
    const { photoreference, maxwidth = 800 } = req.query;

    if (!photoreference) {
      return res.status(400).json({
        success: false,
        error: "Photo reference is required",
      });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Google Maps API key not configured",
      });
    }

    // Construct the Google Photos API URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoreference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    // Fetch the image from Google
    const response = await fetch(photoUrl);

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`);
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Set appropriate headers
    res.set({
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      "Content-Length": buffer.length,
    });

    // Send the image
    res.send(buffer);
  } catch (error) {
    console.error("Photo proxy error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch photo",
      details: error.message,
    });
  }
});

export default router;
