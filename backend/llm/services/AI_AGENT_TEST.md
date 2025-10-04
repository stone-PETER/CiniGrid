# AI Agent - Quick Test Guide

## Prerequisites

1. **Set API Keys** in `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

2. **Start MongoDB**:

```bash
mongod
```

3. **Start Backend**:

```bash
cd backend
npm run dev
```

## Test 1: Check Service Status

```bash
curl http://localhost:5000/api/ai-agent/status
```

**Expected Response:**

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

## Test 2: Find Locations (requires authentication)

### Step 1: Register/Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@test.com",
    "password": "password123"
  }'
```

Save the `token` from response.

### Step 2: Find Locations

```bash
curl -X POST http://localhost:5000/api/ai-agent/find-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "description": "Modern coffee shop with natural light for morning scene"
  }'
```

## Test Scenarios

### Scenario 1: Outdoor Action Scene

```json
{
  "description": "Wide open parking lot or rooftop for car chase scene"
}
```

### Scenario 2: Romantic Scene

```json
{
  "description": "Romantic restaurant with city view for proposal scene"
}
```

### Scenario 3: Thriller Scene

```json
{
  "description": "Dark alley with graffiti and neon lights for thriller night scene"
}
```

### Scenario 4: Historical Drama

```json
{
  "description": "Historic library with tall bookshelves and wooden tables for period drama"
}
```

### Scenario 5: Urban Contemporary

```json
{
  "description": "Busy train station with modern architecture for departure scene"
}
```

## Using Postman

### 1. Check Status

- **Method**: GET
- **URL**: `http://localhost:5000/api/ai-agent/status`
- **Headers**: None required

### 2. Find Locations

- **Method**: POST
- **URL**: `http://localhost:5000/api/ai-agent/find-locations`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN`
- **Body** (raw JSON):

```json
{
  "description": "Modern coffee shop with natural light for morning scene",
  "forceRefresh": false,
  "maxResults": 5
}
```

### 3. Get Cache Stats (Admin only)

- **Method**: GET
- **URL**: `http://localhost:5000/api/ai-agent/stats`
- **Headers**:
  - `Authorization: Bearer YOUR_TOKEN`
- **Note**: User must have 'director' or 'producer' role

### 4. Clear Expired Cache (Admin only)

- **Method**: DELETE
- **URL**: `http://localhost:5000/api/ai-agent/cache/expired`
- **Headers**:
  - `Authorization: Bearer YOUR_TOKEN`
- **Note**: User must have 'director' or 'producer' role

## Expected Results Format

```json
{
  "success": true,
  "cached": false,
  "description": "Modern coffee shop with natural light for morning scene",
  "results": [
    {
      "name": "Blue Bottle Coffee",
      "reason": "This modern coffee shop features floor-to-ceiling windows that flood the space with natural light, perfect for a bright morning scene. The minimalist interior design with clean lines and neutral tones provides an ideal backdrop that won't distract from the actors. The space also has ample seating options for various shot compositions.",
      "rating": 9.2,
      "coordinates": {
        "lat": 40.7489,
        "lng": -73.968
      },
      "address": "160 Berry St, Brooklyn, NY 11249",
      "placeId": "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
      "photos": [
        {
          "photoReference": "ATplDJa7...",
          "width": 4032,
          "height": 3024
        }
      ],
      "types": ["cafe", "food", "point_of_interest"],
      "additionalInfo": {
        "rating": 4.6,
        "userRatingsTotal": 1234,
        "priceLevel": 2
      }
    }
    // ... 4 more locations
  ],
  "metadata": {
    "totalPlacesFound": 28,
    "totalPlacesAnalyzed": 20,
    "processingTime": 4235,
    "apiCalls": {
      "googlePlaces": 2,
      "gemini": 1
    }
  }
}
```

## Testing Cache Behavior

### Test 1: Initial Request (No Cache)

```bash
curl -X POST http://localhost:5000/api/ai-agent/find-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"description": "Coffee shop test"}' \
  | jq '.cached'
```

**Expected**: `false` (first request, not cached)

### Test 2: Repeat Request (From Cache)

```bash
# Run the same request again immediately
curl -X POST http://localhost:5000/api/ai-agent/find-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"description": "Coffee shop test"}' \
  | jq '.cached'
```

**Expected**: `true` (cached result, much faster)

### Test 3: Force Refresh (Bypass Cache)

```bash
curl -X POST http://localhost:5000/api/ai-agent/find-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Coffee shop test",
    "forceRefresh": true
  }' \
  | jq '.cached'
```

**Expected**: `false` (force refresh bypasses cache)

## Troubleshooting

### Error: "AI Agent service is not available"

**Cause**: API keys not configured  
**Solution**: Add `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` to `.env`

### Error: "Not authorized, no token"

**Cause**: Missing authentication token  
**Solution**: Login first and include the token in Authorization header

### Error: "No locations found"

**Cause**: Description too vague or no matching places  
**Solution**: Make description more specific with scene context

### Error: 429 (Too Many Requests)

**Cause**: API rate limit exceeded  
**Solution**: Wait a moment, or check API quota limits

## Performance Benchmarks

### Cached Request

- **Response Time**: 50-100ms
- **API Calls**: 0
- **Cost**: $0

### New Request

- **Response Time**: 3-5 seconds
- **API Calls**:
  - Google Places: 1-2 calls
  - Gemini: 1 call
- **Cost**: ~$0.01-0.02 per request

## MongoDB Cache Inspection

```bash
# Connect to MongoDB
mongosh

# Use the database
use location-scouting

# View cached recommendations
db.airecommendations.find().pretty()

# Count cached entries
db.airecommendations.countDocuments()

# Find most accessed
db.airecommendations.find().sort({accessCount: -1}).limit(5)

# Find recent
db.airecommendations.find().sort({createdAt: -1}).limit(5)
```

## Success Criteria

✅ Status endpoint returns `available: true`  
✅ Find locations returns 5 ranked results  
✅ Response includes name, reason, rating, coordinates  
✅ Second identical request returns cached result  
✅ Processing time < 5 seconds for new requests  
✅ Cache stats show correct counts  
✅ Results are saved in MongoDB

## Next Steps

1. ✅ Test all API endpoints
2. ✅ Verify caching is working
3. ✅ Check MongoDB for saved results
4. ✅ Test with different scene descriptions
5. ✅ Monitor API usage and costs
6. 🔄 Integrate with frontend UI
7. 🔄 Add to scouting request workflow

---

**Happy Testing!** 🎬
