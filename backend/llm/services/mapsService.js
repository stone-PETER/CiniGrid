import { Client } from "@googlemaps/google-maps-services-js";

const mapsClient = new Client({});

// Get place details from Google Maps
export const getPlaceDetails = async (placeId) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const response = await mapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "photos",
          "rating",
          "types",
          "formatted_phone_number",
          "opening_hours",
        ],
      },
    });

    return response.data.result;
  } catch (error) {
    console.error("Google Maps API error:", error);
    throw error;
  }
};

// Search for places by text query
export const searchPlaces = async (query, location = null) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const params = {
      query,
      key: process.env.GOOGLE_MAPS_API_KEY,
    };

    if (location) {
      params.location = location; // { lat, lng }
      params.radius = 5000; // 5km radius
    }

    const response = await mapsClient.textSearch({
      params,
    });

    return response.data.results;
  } catch (error) {
    console.error("Google Maps search error:", error);
    throw error;
  }
};

// Geocode an address
export const geocodeAddress = async (address) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const response = await mapsClient.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      throw new Error("Address not found");
    }

    const result = response.data.results[0];
    return {
      address: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      placeId: result.place_id,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

// Get nearby places
export const getNearbyPlaces = async (
  coordinates,
  radius = 5000,
  type = null
) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const params = {
      location: coordinates, // { lat, lng }
      radius,
      key: process.env.GOOGLE_MAPS_API_KEY,
    };

    if (type) {
      params.type = type;
    }

    const response = await mapsClient.placesNearby({
      params,
    });

    return response.data.results;
  } catch (error) {
    console.error("Nearby places error:", error);
    throw error;
  }
};

// Check if Google Maps service is available
export const isMapsAvailable = () => {
  return !!process.env.GOOGLE_MAPS_API_KEY;
};
