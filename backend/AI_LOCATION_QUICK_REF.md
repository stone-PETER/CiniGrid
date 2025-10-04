# Quick Reference: AI Location Routes

## 🚀 Quick Start

### Test the endpoints (with server running):

```bash
# 1. Get JWT token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Save the token
$token = "your-jwt-token-here"

# 2. Test Location Analysis
curl -X POST http://localhost:5000/api/locations/analyze \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urban Rooftop",
    "description": "Modern city rooftop with skyline views",
    "region": "Los Angeles",
    "sceneType": "action"
  }'

# 3. Test AI-Enhanced Search
curl -X POST http://localhost:5000/api/locations/search \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "beach sunset scene",
    "region": "California",
    "limit": 10
  }'

# 4. Test Similar Locations (replace :id with actual location ID)
curl http://localhost:5000/api/locations/:id/similar \
  -H "Authorization: Bearer $token"
```

## 📋 Endpoints Summary

| Endpoint                     | Method | Purpose                      | Auth |
| ---------------------------- | ------ | ---------------------------- | ---- |
| `/api/locations/analyze`     | POST   | Analyze location suitability | ✓    |
| `/api/locations/:id/similar` | GET    | Find similar locations       | ✓    |
| `/api/locations/search`      | POST   | AI-enhanced search           | ✓    |

## 🔧 Configuration

### Required Environment Variables:

```env
# For AI Agent
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key

# For Database & Auth
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Optional (Fallback):

- If AI keys missing → Uses mock data
- If MongoDB down → AI works without caching
- Response includes `"source"` field to indicate mode

## 📊 Response Formats

### Analyze Response:

```json
{
  "success": true,
  "data": {
    "analysis": {
      "suitabilityScore": 8.5,
      "pros": ["..."],
      "cons": ["..."],
      "recommendations": [...]
    },
    "similarLocations": [...],
    "source": "ai-agent" | "mock"
  }
}
```

### Search Response:

```json
{
  "success": true,
  "data": {
    "existingLocations": [...],
    "aiSuggestions": [...],
    "counts": {
      "existing": 2,
      "aiSuggestions": 3,
      "total": 5
    },
    "source": "hybrid" | "database-only"
  }
}
```

### Similar Locations Response:

```json
{
  "success": true,
  "data": {
    "original": { "title": "...", "region": "..." },
    "suggestions": [...],
    "count": 5,
    "source": "ai-agent" | "mock",
    "cached": true | false
  }
}
```

## ⚡ Performance

- **First Request**: 2-5s (AI processing)
- **Cached Request**: <100ms (220x faster)
- **Mock Fallback**: <10ms

## 🧪 Testing

```bash
# Run test suite
node backend/test-location-ai.js

# Expected output:
# ✓ Location analysis successful
# ✓ Search with AI enhancement
# ✓ Similar locations found
# ✓ Edge cases handled
```

## 🐛 Common Issues

**Getting mock data?**
→ Check `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` in `.env`

**Slow responses?**
→ First request is always slower (no cache), subsequent requests are fast

**404 on /similar?**
→ Make sure location ID exists in database

## 📖 Full Documentation

- **API Docs**: `AI_LOCATION_ROUTES.md`
- **Implementation**: `AI_LOCATION_ROUTES_COMPLETE.md`
- **AI Agent**: `llm/services/AI_AGENT_DOCS.md`

## 🎯 Use Cases

1. **Pre-Scout Analysis**: Analyze before visiting
2. **Find Backups**: Get similar locations
3. **Discover New**: Search with AI suggestions
4. **Compare Options**: Score multiple locations

---

**Ready to use!** All endpoints are live at `/api/locations/*`
