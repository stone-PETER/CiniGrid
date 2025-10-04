# Quick Start: Testing AI Location Recommendations

## 🚀 Start the Server

```powershell
cd c:\programs\CiniGrid\backend
npm run dev
```

Server starts on: `http://localhost:5000`

## 🔐 Get Authentication Token

```powershell
# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"scout_sara\",\"password\":\"password123\"}'
```

Copy the `token` from response.

## 🤖 Test AI Search Endpoint

### Basic Search (AI Agent):

```powershell
curl -X POST http://localhost:5000/api/ai/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{\"prompt\":\"Modern coffee shop with natural light\"}'
```

### With Options:

```powershell
curl -X POST http://localhost:5000/api/ai/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{
    \"prompt\":\"Historic building for period drama\",
    \"maxResults\":3,
    \"forceRefresh\":false
  }'
```

### Force Mock Data (Testing):

```powershell
curl -X POST http://localhost:5000/api/ai/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{\"prompt\":\"Any location\",\"useMock\":true}'
```

## 📊 Response

```json
{
  "success": true,
  "data": {
    "prompt": "Modern coffee shop with natural light",
    "suggestions": [
      {
        "title": "Location Name",
        "description": "Why it's suitable...",
        "rating": 9.2,
        "coordinates": { "lat": 37.7749, "lng": -122.4194 },
        "region": "City, State",
        "placeId": "Google_Place_ID"
      }
    ],
    "count": 5,
    "source": "ai-agent", // or "mock"
    "cached": false, // true if from cache
    "metadata": {
      "processingTime": 3450,
      "totalPlacesFound": 20
    }
  }
}
```

## 🧪 Unit Test

```powershell
node test-ai-controller.js
```

## ✅ What to Check

1. **Source**: Should be "ai-agent" if API keys configured
2. **Cached**: Second request should be cached = true
3. **Rating**: Real locations have ratings 0-10
4. **PlaceId**: Real locations have Google Place IDs
5. **Metadata**: Shows API calls and processing time

## 🔧 Troubleshooting

**Getting mock data instead of AI?**

- Check `.env` has `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY`
- Check console for "🤖 Using real AI Agent" message

**Slow response?**

- First request: 5-8s (calling APIs)
- Cached requests: < 200ms
- This is normal!

**MongoDB errors?**

- System still works, just no caching
- Update `MONGO_URI` in `.env` for caching

## 📝 Notes

- Mock data is Kerala, India locations
- Real AI finds locations globally based on prompt
- Cache lasts 7 days
- Use `forceRefresh: true` to bypass cache
