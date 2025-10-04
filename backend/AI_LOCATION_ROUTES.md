# AI-Powered Location Routes Documentation

## Overview

The Location Scouting API now includes three new AI-powered endpoints that leverage Google Places API and Gemini AI to enhance location discovery and analysis.

## New Endpoints

### 1. POST `/api/locations/analyze`

Analyze a location's suitability for filming with AI-powered insights.

**Authentication:** Required (JWT token)

**Request Body:**

```json
{
  "title": "Urban Rooftop",
  "description": "Modern city rooftop with skyline views for action scene",
  "coordinates": {
    "lat": 34.0522,
    "lng": -118.2437
  },
  "region": "Los Angeles",
  "sceneType": "action sequence"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "analysis": {
      "suitabilityScore": 8.5,
      "pros": [
        "Good accessibility for crew and equipment",
        "Authentic atmosphere for the scene",
        "Available natural lighting"
      ],
      "cons": [
        "May require special permits",
        "Weather dependent for outdoor scenes"
      ],
      "recommendations": [
        {
          "name": "Similar Location 1",
          "reason": "Great for action scenes",
          "rating": 8.5
        }
      ]
    },
    "similarLocations": [
      {
        "title": "Alternative Rooftop",
        "description": "Similar venue with better lighting",
        "coordinates": { "lat": 34.0522, "lng": -118.2437 },
        "region": "Downtown LA",
        "rating": 8.2,
        "placeId": "ChIJabc123..."
      }
    ],
    "source": "ai-agent",
    "metadata": {
      "processingTime": 2500,
      "modelUsed": "gemini-2.5-flash-lite"
    }
  }
}
```

**Use Cases:**

- Pre-scout analysis before site visit
- Compare multiple locations
- Get AI recommendations for improvements
- Discover alternative locations

---

### 2. GET `/api/locations/:id/similar`

Find similar locations based on an existing location in the database.

**Authentication:** Required (JWT token)

**URL Parameters:**

- `id` - MongoDB ObjectId of an existing PotentialLocation or FinalizedLocation

**Response:**

```json
{
  "success": true,
  "data": {
    "original": {
      "title": "Sunset Beach",
      "region": "Malibu, CA"
    },
    "suggestions": [
      {
        "title": "Paradise Cove",
        "description": "Similar beach with better facilities",
        "coordinates": { "lat": 34.0259, "lng": -118.7798 },
        "region": "Malibu, CA",
        "rating": 9.0,
        "placeId": "ChIJdef456...",
        "tags": ["beach", "scenic", "parking"],
        "confidence": 0.9
      }
    ],
    "count": 5,
    "source": "ai-agent",
    "cached": true,
    "metadata": {
      "cacheAge": 3600000
    }
  }
}
```

**Use Cases:**

- Find backup locations
- Discover nearby alternatives
- Compare similar venues
- Plan multi-location shoots

---

### 3. POST `/api/locations/search`

AI-enhanced search that combines database queries with AI-generated suggestions.

**Authentication:** Required (JWT token)

**Request Body:**

```json
{
  "query": "beach sunset romantic scene",
  "tags": ["beach", "romantic"],
  "region": "California",
  "limit": 10
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "beach sunset romantic scene",
    "existingLocations": [
      {
        "_id": "60d5ec49f1b2c8b1f8c4e8a1",
        "title": "Malibu Beach",
        "description": "Beautiful sunset views",
        "region": "Malibu, CA",
        "addedBy": {
          "username": "scout1",
          "role": "scout"
        }
      }
    ],
    "aiSuggestions": [
      {
        "title": "El Matador Beach",
        "description": "Perfect for romantic sunset scenes with rock formations",
        "coordinates": { "lat": 34.0359, "lng": -118.8798 },
        "region": "Malibu, CA",
        "rating": 9.2,
        "placeId": "ChIJghi789...",
        "tags": ["beach", "scenic", "sunset"],
        "source": "ai-suggestion",
        "cached": false
      }
    ],
    "counts": {
      "existing": 2,
      "aiSuggestions": 3,
      "total": 5
    },
    "source": "hybrid"
  }
}
```

**Use Cases:**

- Discover new locations
- Augment existing database
- Find locations matching specific criteria
- Get both saved and AI-suggested locations

---

## AI Integration Details

### AI Agent Status

The system automatically detects if AI Agent (Google Places + Gemini AI) is available:

**Requirements:**

- `GEMINI_API_KEY` - For AI ranking and analysis
- `GOOGLE_MAPS_API_KEY` - For location discovery
- MongoDB connection - For caching (optional)

**Fallback Behavior:**

- If AI Agent is unavailable, endpoints return mock data
- No errors thrown, graceful degradation
- Response includes `"source": "mock"` or `"source": "ai-agent"`

### Performance

**With AI Agent:**

- Fresh search: 2-5 seconds
- Cached search: <100ms
- Cache duration: 7 days
- 220x speedup with caching

**Caching Strategy:**

- SHA-256 hash of search query
- MongoDB TTL index (7 days)
- Access count tracking
- Automatic cache refresh option

### Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common Status Codes:**

- `200` - Success
- `400` - Bad request (missing required fields)
- `401` - Unauthorized (no JWT token)
- `404` - Location not found (for /:id endpoints)
- `500` - Internal server error

---

## Integration Examples

### Example 1: Location Analysis Workflow

```javascript
// 1. User scouts a location
const analysis = await fetch("/api/locations/analyze", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Historic Theater",
    description: "Art deco theater for period drama",
    region: "Downtown LA",
    sceneType: "period drama",
  }),
});

// 2. Review AI analysis
const { analysis, similarLocations } = await analysis.json();

// 3. If suitable, add to potential locations
if (analysis.suitabilityScore > 7.5) {
  await fetch("/api/locations/direct-add/potential", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Historic Theater",
      description: "Art deco theater for period drama",
      coordinates: { lat: 34.0522, lng: -118.2437 },
      region: "Downtown LA",
    }),
  });
}
```

### Example 2: Find Similar Locations

```javascript
// Get similar locations for backup options
const response = await fetch(
  "/api/locations/60d5ec49f1b2c8b1f8c4e8a1/similar",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const { suggestions } = await response.json();

// Present alternatives to production team
suggestions.forEach((location) => {
  console.log(`${location.title} - Rating: ${location.rating}`);
  console.log(`Reason: ${location.description}`);
});
```

### Example 3: AI-Enhanced Search

```javascript
// Search with AI enhancement
const response = await fetch("/api/locations/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "industrial warehouse cyberpunk aesthetic",
    region: "Los Angeles",
    limit: 10,
  }),
});

const { existingLocations, aiSuggestions, counts } = await response.json();

console.log(`Found ${counts.existing} saved locations`);
console.log(`AI suggested ${counts.aiSuggestions} new locations`);
```

---

## Testing

Run the test suite:

```bash
node backend/test-location-ai.js
```

**Test Coverage:**

- ✅ Location analysis (with/without AI)
- ✅ Similar location discovery
- ✅ AI-enhanced search (hybrid mode)
- ✅ Edge cases & validation
- ✅ Fallback to mock data
- ✅ Database integration

---

## API Reference Summary

| Endpoint                     | Method | Auth | Purpose                      |
| ---------------------------- | ------ | ---- | ---------------------------- |
| `/api/locations/analyze`     | POST   | ✓    | Analyze location suitability |
| `/api/locations/:id/similar` | GET    | ✓    | Find similar locations       |
| `/api/locations/search`      | POST   | ✓    | AI-enhanced search           |
| `/api/locations/potential`   | POST   | ✓    | Add to potential locations   |
| `/api/locations/potential`   | GET    | ✓    | List potential locations     |
| `/api/locations/finalized`   | GET    | ✓    | List finalized locations     |

---

## Best Practices

1. **Use Analysis Before Adding**: Run `/analyze` before adding locations to get AI insights
2. **Check Similar Locations**: Use `/similar` to find backup options
3. **Leverage Caching**: Similar queries return cached results (fast!)
4. **Handle Fallbacks**: Check `source` field to know if AI or mock data
5. **Set Appropriate Limits**: Use `limit` parameter in search to control results
6. **Include Region**: Region filtering improves AI suggestions
7. **Use Scene Types**: Provide `sceneType` in analysis for better recommendations

---

## Troubleshooting

**Issue: Getting mock data instead of AI results**

- ✅ Check `GEMINI_API_KEY` is set in `.env`
- ✅ Check `GOOGLE_MAPS_API_KEY` is set in `.env`
- ✅ Verify API keys are valid
- ✅ Check MongoDB connection

**Issue: Slow responses**

- ✅ First request is always slower (no cache)
- ✅ Subsequent requests use cache (~220x faster)
- ✅ Use `forceRefresh: false` in queries
- ✅ Check network connection to Google APIs

**Issue: 404 on /:id/similar**

- ✅ Verify location ID exists in database
- ✅ Check ID is valid MongoDB ObjectId format
- ✅ Ensure using correct collection (potential or finalized)

---

## Next Steps

1. **Frontend Integration**: Update UI to use new endpoints
2. **Batch Operations**: Add bulk analysis support
3. **Custom Filters**: Extend search with more parameters
4. **Export Results**: Add CSV/PDF export for AI analysis
5. **Scheduling**: Add automated location discovery jobs

---

## Support

For issues or questions:

- Check logs: AI Agent logs to console with detailed info
- Review test results: Run `test-location-ai.js`
- Check cache stats: Use `/api/ai-agent/cache-stats` endpoint
- API documentation: See `AI_AGENT_DOCS.md`

---

**Last Updated:** 2025-01-22  
**Version:** 1.0.0  
**Maintained by:** CiniGrid Development Team
