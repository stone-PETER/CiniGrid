# AI Agent Service - Documentation

## Overview

The AI Agent service is an intelligent location recommendation system that combines:

- **Google Places API** - To find real-world locations
- **Google Gemini AI** - To rank locations based on scene suitability
- **MongoDB Caching** - To store and reuse results efficiently

## Features

### 🎯 Core Functionality

1. **Intelligent Search** - Uses Google Places Text Search and Nearby Search
2. **AI-Powered Ranking** - Gemini AI analyzes and ranks locations
3. **Smart Caching** - MongoDB caching with 7-day expiration
4. **Top 5 Results** - Returns the most suitable locations
5. **Detailed Metadata** - Processing time, API calls, cache status

### 🚀 Key Benefits

- **Cost Efficient** - Caches results to minimize API calls
- **Fast Response** - Cached requests return instantly
- **Intelligent Analysis** - AI considers multiple factors for ranking
- **Comprehensive Data** - Includes coordinates, photos, ratings, and more

## API Endpoints

### 1. Find and Rank Locations

```http
POST /api/ai-agent/find-locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "A dark, moody alley for a thriller scene at night",
  "forceRefresh": false,  // optional, default: false
  "maxResults": 5         // optional, default: 5, max: 10
}
```

**Response:**

```json
{
  "success": true,
  "cached": false,
  "description": "A dark, moody alley for a thriller scene at night",
  "results": [
    {
      "name": "Location Name",
      "reason": "Detailed explanation of why this location is suitable...",
      "rating": 8.5,
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.006
      },
      "address": "123 Main St, New York, NY",
      "placeId": "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
      "photos": [
        {
          "photoReference": "...",
          "width": 4032,
          "height": 3024
        }
      ],
      "types": ["point_of_interest", "establishment"],
      "additionalInfo": {
        "rating": 4.5,
        "userRatingsTotal": 234,
        "priceLevel": 2
      }
    }
    // ... 4 more locations
  ],
  "metadata": {
    "totalPlacesFound": 25,
    "totalPlacesAnalyzed": 20,
    "processingTime": 3456,
    "apiCalls": {
      "googlePlaces": 2,
      "gemini": 1
    }
  }
}
```

### 2. Check AI Agent Status

```http
GET /api/ai-agent/status
```

**Response:**

```json
{
  "success": true,
  "available": true,
  "message": "AI Agent is ready",
  "services": {
    "gemini": true,
    "googleMaps": true
  }
}
```

### 3. Get Cache Statistics

```http
GET /api/ai-agent/stats
Authorization: Bearer <token>
Roles: director, producer
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalCachedRequests": 45,
    "recentlyUsed24h": 12,
    "popularQueries": [
      {
        "description": "Modern coffee shop for morning scene",
        "accessCount": 15,
        "lastAccessedAt": "2025-10-04T10:30:00.000Z"
      }
      // ... more popular queries
    ]
  }
}
```

### 4. Clear Expired Cache

```http
DELETE /api/ai-agent/cache/expired
Authorization: Bearer <token>
Roles: director, producer
```

**Response:**

```json
{
  "success": true,
  "message": "Cleared 8 expired cache entries",
  "deletedCount": 8
}
```

## How It Works

### Step 1: Cache Check

```javascript
// Generate hash from description
const hash = SHA256(description.toLowerCase().trim());

// Check if cached result exists
const cached = await AIRecommendation.findOne({ descriptionHash: hash });
if (cached && !forceRefresh) {
  return cached.results; // Instant response!
}
```

### Step 2: Google Places Search

```javascript
// Text search
const places = await googleMaps.textSearch({ query: description });

// Nearby search (if needed for more options)
if (places.length < 20) {
  const nearby = await googleMaps.placesNearby({
    location: places[0].geometry.location,
    keyword: description,
  });
  places.push(...nearby);
}
```

### Step 3: Gemini AI Ranking

```javascript
const prompt = `
You are an expert location scout.
Scene: "${description}"
Locations: ${JSON.stringify(places)}

Rank by suitability considering:
- Visual appeal
- Accessibility
- Atmosphere
- Unique features

Return top 5 as JSON with name, reason, rating, coordinates.
`;

const ranked = await gemini.generateContent(prompt);
```

### Step 4: Cache & Return

```javascript
// Save to MongoDB with 7-day expiration
await AIRecommendation.create({
  description,
  descriptionHash: hash,
  results: ranked,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
});

return results;
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Required for AI Agent
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Getting API Keys

#### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or select a project
3. Generate API key
4. Add to `.env` as `GEMINI_API_KEY`

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Places API
   - Geocoding API
3. Create credentials → API Key
4. Add to `.env` as `GOOGLE_MAPS_API_KEY`

## Usage Examples

### Example 1: Basic Usage

```javascript
// Client-side request
const response = await fetch("/api/ai-agent/find-locations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    description: "Romantic restaurant with city view for proposal scene",
  }),
});

const data = await response.json();
console.log(data.results); // Top 5 ranked locations
```

### Example 2: Force Refresh

```javascript
// Bypass cache and get fresh results
const response = await fetch("/api/ai-agent/find-locations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    description: "Busy train station for chase scene",
    forceRefresh: true, // Get fresh results
  }),
});
```

### Example 3: Custom Result Count

```javascript
// Get top 3 instead of 5
const response = await fetch("/api/ai-agent/find-locations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    description: "Beach sunset for romantic finale",
    maxResults: 3,
  }),
});
```

## Caching System

### Cache Structure

```javascript
{
  description: "Original search description",
  descriptionHash: "SHA256 hash of description",
  results: [...], // Ranked locations
  metadata: {
    totalPlacesFound: 30,
    totalPlacesAnalyzed: 20,
    processingTime: 4523,
    apiCalls: { googlePlaces: 2, gemini: 1 }
  },
  expiresAt: Date, // 7 days from creation
  accessCount: 5,
  lastAccessedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Cache Benefits

- **Instant Response** - Cached requests return in <100ms
- **Cost Savings** - Avoid repeated API calls
- **Consistency** - Same description returns same results
- **Usage Tracking** - Monitor popular queries

### Cache Management

```javascript
// Automatic expiration after 7 days
expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// MongoDB TTL index handles deletion
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Manual cleanup (optional)
await clearExpiredCache();
```

## Error Handling

### Common Errors

1. **Missing API Keys**

```json
{
  "success": false,
  "message": "AI Agent service is not available. Please configure GEMINI_API_KEY and GOOGLE_MAPS_API_KEY."
}
```

2. **No Locations Found**

```json
{
  "success": false,
  "message": "No locations found matching the description"
}
```

3. **Invalid Description**

```json
{
  "success": false,
  "message": "Description must be between 10 and 500 characters"
}
```

4. **Gemini API Error**

```json
{
  "success": false,
  "message": "Failed to rank locations with AI: <specific error>"
}
```

## Performance

### Response Times

- **Cached Request**: 50-100ms
- **New Request**: 3-5 seconds
  - Google Places: 1-2s
  - Gemini Ranking: 1-2s
  - MongoDB Save: <100ms

### API Limits

- **Google Places**:
  - Free tier: Limited requests/day
  - Paid: Based on usage
- **Gemini API**:
  - Free tier: 60 requests/minute
  - Paid: Higher limits

### Cost Optimization

1. **Caching** - Reduces API calls by ~80%
2. **Result Limit** - Analyze max 20 places
3. **7-day Expiration** - Balance freshness vs cost
4. **Smart Search** - Use text + nearby search strategically

## Best Practices

### Writing Good Descriptions

✅ **Good:**

- "Dark alley with graffiti for thriller night scene"
- "Modern coffee shop with natural light for morning scene"
- "Historic library with tall shelves for research montage"

❌ **Bad:**

- "Location" (too vague)
- "Nice place" (not descriptive)
- "Somewhere to film" (no context)

### When to Use forceRefresh

- Location availability changed
- Need latest Google data
- Previous results were unsatisfactory
- Testing/development

### Monitoring Usage

```javascript
// Check cache statistics regularly
const stats = await getCacheStats();
console.log(
  `Cache hit rate: ${stats.recentlyUsed24h / stats.totalCachedRequests}`
);

// Clear expired entries weekly
await clearExpiredCache();
```

## Integration Examples

### React Frontend

```typescript
const useLocationFinder = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const findLocations = async (description: string) => {
    setLoading(true);
    try {
      const response = await api.post("/ai-agent/find-locations", {
        description,
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { findLocations, loading, results };
};
```

### Node.js Backend

```javascript
import { findAndRankLocations } from "./services/aiAgent.js";

// Use in your controllers
const locations = await findAndRankLocations(
  "Busy marketplace for crowd scene",
  { maxResults: 5 }
);
```

## Troubleshooting

### Issue: "AI Agent is not available"

**Solution:** Check that both API keys are set in `.env`

### Issue: "No locations found"

**Solution:** Make description more specific or try different wording

### Issue: Slow response times

**Solution:** Check if caching is working, verify API key quotas

### Issue: Incorrect rankings

**Solution:** Provide more detailed scene description to Gemini

## Future Enhancements

- [ ] Support for custom search radius
- [ ] Filter by price range
- [ ] Time-based availability
- [ ] Weather integration
- [ ] Custom ranking weights
- [ ] Batch processing
- [ ] Export to PDF/CSV
- [ ] Integration with calendar
- [ ] User feedback loop
- [ ] A/B testing for prompts

---

**Need Help?** Check the main README or contact support.
