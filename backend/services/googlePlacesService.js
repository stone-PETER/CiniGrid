import axios from "axios";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Search for nearby places using Google Places Nearby Search API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} type - Place type (e.g., "lodging", "restaurant", "transit_station")
 * @param {number} radiusMiles - Search radius in miles (default 3)
 * @param {number} limit - Maximum results (default 5)
 * @returns {Promise<Array>} Array of nearby places
 */
async function searchNearbyPlaces(lat, lng, type, radiusMiles = 3, limit = 5) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("⚠️ Google Places API key not configured");
    return [];
  }

  try {
    const radiusMeters = Math.round(radiusMiles * 1609.34); // Convert miles to meters

    const response = await axios.get(`${PLACES_API_BASE}/nearbysearch/json`, {
      params: {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        type: type,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (
      response.data.status !== "OK" &&
      response.data.status !== "ZERO_RESULTS"
    ) {
      console.error(`Google Places API error: ${response.data.status}`);
      return [];
    }

    const results = response.data.results || [];
    return results.slice(0, limit);
  } catch (error) {
    console.error("Error fetching nearby places:", error.message);
    return [];
  }
}

/**
 * Get nearby hotels (lodging)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Array of hotels with name, address, distance, price range, rating
 */
export async function getNearbyHotels(lat, lng) {
  const places = await searchNearbyPlaces(lat, lng, "lodging", 3, 5);

  return places.map((place) => {
    const distance = calculateDistance(
      lat,
      lng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    // Convert price_level (0-4) to price range string
    let priceRange = "Unknown";
    if (place.price_level !== undefined) {
      priceRange = "$".repeat(place.price_level + 1);
    }

    return {
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      distance: distance,
      priceRange: priceRange,
      rating: place.rating || 0,
      placeId: place.place_id,
    };
  });
}

/**
 * Get nearby restaurants
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Array of restaurants with name, address, distance, rating, price level
 */
export async function getNearbyRestaurants(lat, lng) {
  const places = await searchNearbyPlaces(lat, lng, "restaurant", 3, 5);

  return places.map((place) => {
    const distance = calculateDistance(
      lat,
      lng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    return {
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      distance: distance,
      rating: place.rating || 0,
      priceLevel: place.price_level || 0,
      placeId: place.place_id,
    };
  });
}

/**
 * Get nearby transportation options
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Transportation data with metro, bus, parking
 */
export async function getNearbyTransportation(lat, lng) {
  try {
    // Search for transit stations (metro/subway)
    const transitStations = await searchNearbyPlaces(
      lat,
      lng,
      "transit_station",
      3,
      3
    );

    // Search for bus stations
    const busStations = await searchNearbyPlaces(lat, lng, "bus_station", 3, 3);

    // Search for parking
    const parkingLots = await searchNearbyPlaces(lat, lng, "parking", 2, 5);

    const transportation = {
      nearestMetro: null,
      nearestBusStop: null,
      parkingFacilities: [],
    };

    // Find nearest metro/subway
    if (transitStations.length > 0) {
      const nearest = transitStations[0];
      const distance = calculateDistance(
        lat,
        lng,
        nearest.geometry.location.lat,
        nearest.geometry.location.lng
      );
      transportation.nearestMetro = {
        name: nearest.name,
        distance: distance,
      };
    }

    // Find nearest bus stop
    if (busStations.length > 0) {
      const nearest = busStations[0];
      const distance = calculateDistance(
        lat,
        lng,
        nearest.geometry.location.lat,
        nearest.geometry.location.lng
      );
      transportation.nearestBusStop = {
        name: nearest.name,
        distance: distance,
      };
    }

    // Map parking facilities
    transportation.parkingFacilities = parkingLots.map((place) => {
      const distance = calculateDistance(
        lat,
        lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      return {
        name: place.name,
        distance: distance,
        type: place.types?.includes("parking")
          ? "parking_lot"
          : "street_parking",
      };
    });

    return transportation;
  } catch (error) {
    console.error("Error fetching transportation data:", error.message);
    return {
      nearestMetro: null,
      nearestBusStop: null,
      parkingFacilities: [],
    };
  }
}

/**
 * Fetch all location enrichment data (hotels, restaurants, transportation)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Combined data object
 */
export async function fetchLocationEnrichmentData(lat, lng) {
  try {
    console.log(`🗺️ Fetching enrichment data for (${lat}, ${lng})...`);

    const [hotels, restaurants, transportation] = await Promise.all([
      getNearbyHotels(lat, lng),
      getNearbyRestaurants(lat, lng),
      getNearbyTransportation(lat, lng),
    ]);

    return {
      nearbyHotels: hotels,
      nearbyRestaurants: restaurants,
      transportation: transportation,
      lastFetched: new Date(),
      cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  } catch (error) {
    console.error("Error fetching location enrichment data:", error.message);
    return {
      nearbyHotels: [],
      nearbyRestaurants: [],
      transportation: {
        nearestMetro: null,
        nearestBusStop: null,
        parkingFacilities: [],
      },
      lastFetched: new Date(),
      cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}

export { calculateDistance };
