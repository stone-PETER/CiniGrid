# Location Comparison Integration - Quick Reference

## 🎯 Feature Access

### User Navigation Path

```
Login → Project Dashboard → Locations Page → [Compare] Tab
```

### Tab Structure

```
LocationsScreen
├── Tab: "Locations" (existing)
│   ├── Left Panel: Potential Locations
│   ├── Center Panel: Search & Suggestions
│   └── Right Panel: Finalized Locations
│
└── Tab: "Compare" (NEW) ✨
    └── LocationComparisonTab Component
        ├── Requirement Selector
        ├── Weight Sliders (4x)
        ├── Run Comparison Button
        ├── AI Recommendation Box
        ├── Comparison Table
        └── Export Button
```

---

## 📡 API Endpoints (All Working)

### Location Requirements

```http
GET    /api/locations/requirements/:projectId          # List all requirements
POST   /api/locations/requirements                     # Create requirement
PATCH  /api/locations/requirements/:requirementId     # Update requirement
DELETE /api/locations/requirements/:requirementId     # Delete requirement
```

### Comparison

```http
POST   /api/locations/compare/:requirementId          # Run comparison
POST   /api/locations/:locationId/refresh-cache       # Refresh cached data
```

### Request Example

```javascript
// Run comparison
POST /api/locations/compare/67015a3b2c9d8f001a234567
Headers: { Authorization: "Bearer <JWT_TOKEN>" }
Body: {
  "weights": {
    "budget": 30,
    "similarity": 35,
    "crewAccess": 20,
    "transportation": 15
  }
}
```

### Response Example

```javascript
{
  "rankedLocations": [
    {
      "_id": "670123...",
      "name": "Getty Villa",
      "scores": {
        "overall": 8.7,
        "budget": 8.5,
        "similarity": 9.2,
        "crewAccess": 8.9,
        "transportation": 8.2
      },
      "budget": {
        "dailyRate": 3500,
        "estimatedMin": 3000,
        "estimatedMax": 4000,
        "confidence": 85,
        "reasoning": "Based on similar historic venues..."
      },
      "amenities": {
        "parking": true,
        "wifi": true,
        "power": true,
        "kitchen": false,
        "greenRoom": false,
        "bathroom": true,
        "loadingDock": false,
        "cateringSpace": false
      },
      "cachedData": {
        "nearbyHotels": [...],
        "nearbyRestaurants": [...],
        "transportation": {...},
        "weather": {...}
      }
    }
  ],
  "aiRecommendation": "Getty Villa ranks #1 due to...",
  "comparisonMetadata": {
    "totalLocations": 5,
    "cacheHits": 3,
    "cacheMisses": 2,
    "executionTime": "2.3s"
  }
}
```

---

## 🔑 Required Setup

### Environment Variables Checklist

```bash
# backend/.env

✅ GEMINI_API_KEY=AIza...           # Already set
✅ GOOGLE_PLACES_API_KEY=AIza...    # Already set
⚠️ OPENWEATHER_API_KEY=...          # REQUIRED - Must add!
✅ MONGODB_URI=mongodb://...         # Already set
✅ JWT_SECRET=...                    # Already set
```

### Critical Action Required

```bash
# 1. Get OpenWeather API key (FREE)
#    Visit: https://openweathermap.org/api
#    Plan: "Free" (1,000 calls/day)

# 2. Add to backend/.env
echo "OPENWEATHER_API_KEY=your_key_here" >> backend/.env

# 3. Restart backend
cd backend
npm start
```

---

## 🚀 Quick Test

### Minimal Test (5 minutes)

**Step 1: Create Requirement (via API)**

```powershell
# PowerShell
$token = "YOUR_JWT_TOKEN"
$projectId = "YOUR_PROJECT_ID"

$body = @{
    prompt = "Victorian mansion"
    notes = "Need large garden"
    priority = "High"
    budget = @{ max = 5000; currency = "USD" }
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:5000/api/locations/requirements" `
    -Method POST `
    -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
    -Body $body
```

**Step 2: Add Potential Locations (via UI)**

```
1. Go to Locations tab
2. Search: "Victorian mansion Los Angeles"
3. Add 3-5 results to Potential panel
```

**Step 3: Link Locations to Requirement (via API)**

```powershell
# For each location ID
$locationId = "LOCATION_ID"
$requirementId = "REQUIREMENT_ID"

Invoke-RestMethod `
    -Uri "http://localhost:5000/api/locations/potential/$locationId" `
    -Method PATCH `
    -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
    -Body (@{requirementId=$requirementId} | ConvertTo-Json)
```

**Step 4: Run Comparison (via UI)**

```
1. Click "Compare" tab
2. Select requirement from dropdown
3. Click "Run Comparison"
4. Wait 15-30 seconds
5. View results!
```

---

## 📊 What to Expect

### First Comparison (15-30 seconds)

```
Loading... Enriching location data
├── Fetching Google Places data (hotels, restaurants)
├── Fetching OpenWeather data (current, forecast)
├── Extracting amenities with Gemini AI
├── Estimating expenses with Gemini AI
└── Calculating scores

✅ Comparison complete! (28.4s)
```

### Subsequent Comparisons (<2 seconds)

```
Loading... Using cached data
├── ✓ Google Places (cached)
├── ✓ OpenWeather (cached)
├── ✓ Amenities (cached)
├── ✓ Expenses (cached)
└── Calculating scores

✅ Comparison complete! (1.2s)
```

### Results Display

```
┌─────────────────────────────────────────────┐
│ 🤖 AI Recommendation                        │
│ Getty Villa ranks #1 with an overall score  │
│ of 8.7. It offers excellent similarity to   │
│ your Victorian mansion requirement (9.2),   │
│ moderate budget ($3,500/day vs $5,000 max), │
│ and strong crew access with 15 hotels       │
│ within 2 miles...                           │
└─────────────────────────────────────────────┘

Locations sorted by: Overall Score ▼

┌──────┬─────────────────┬───────┬────────┐
│ Rank │ Location        │ Score │ Budget │
├──────┼─────────────────┼───────┼────────┤
│ 🥇   │ Getty Villa     │  8.7  │  8.5   │ ▼
│ 🥈   │ Manor House     │  8.3  │  7.8   │
│ 🥉   │ Victorian Estate│  7.9  │  8.9   │
│      │ Historic Mansion│  7.2  │  6.5   │
│      │ Garden Estate   │  6.8  │  9.1   │
└──────┴─────────────────┴───────┴────────┘

[Expanded: Getty Villa]
├─ Budget: $3,500/day (range: $3,000-$4,000, 85% confidence)
├─ Amenities: ✓ Parking, ✓ WiFi, ✓ Power, ✗ Kitchen
├─ Crew Access: 15 hotels, 32 restaurants within 2 miles
├─ Transportation: Metro 1.5mi, Bus 0.3mi, Parking available
├─ Weather: 72°F sunny, Best months: Apr-Jun, Sep-Nov
└─ Distance: 3.2 mi to "Main Studio" (finalized)
```

---

## 🎛️ Weight Adjustment Examples

### Default Weights (Balanced)

```
Budget:         ████████████░░░░░░░░░░░░░░  30%
Similarity:     ████████████████░░░░░░░░░░  35%
Crew Access:    ████████░░░░░░░░░░░░░░░░░░  20%
Transportation: ██████░░░░░░░░░░░░░░░░░░░░  15%

Best for: General comparison, no strong preferences
```

### Budget-Focused

```
Budget:         ████████████████████████░░  60%
Similarity:     ████░░░░░░░░░░░░░░░░░░░░░░  10%
Crew Access:    ████████░░░░░░░░░░░░░░░░░░  20%
Transportation: ████░░░░░░░░░░░░░░░░░░░░░░  10%

Best for: Tight budget, cost is primary concern
Result: Cheapest locations rank highest
```

### Quality-Focused

```
Budget:         ████░░░░░░░░░░░░░░░░░░░░░░  10%
Similarity:     ████████████████████░░░░░░  50%
Crew Access:    ████████████░░░░░░░░░░░░░░  30%
Transportation: ████░░░░░░░░░░░░░░░░░░░░░░  10%

Best for: High-end production, authenticity matters
Result: Most authentic locations rank highest
```

### Crew-Focused

```
Budget:         ████████░░░░░░░░░░░░░░░░░░  20%
Similarity:     ████████░░░░░░░░░░░░░░░░░░  20%
Crew Access:    ████████████████████░░░░░░  50%
Transportation: ████░░░░░░░░░░░░░░░░░░░░░░  10%

Best for: Large crew, need nearby hotels/restaurants
Result: Locations with best amenities rank highest
```

---

## 🔍 Data Sources

### Google Places API

```
Hotels:
- Query: "hotel" within 3 miles (4.8 km)
- Sort by: Rating (descending)
- Limit: Top 5 results
- Fields: name, rating, address, price level, distance

Restaurants:
- Query: "restaurant" within 3 miles
- Sort by: Rating (descending)
- Limit: Top 5 results
- Fields: name, rating, address, price level, distance

Transportation:
- Query: "transit_station" within 1 mile
- Types: Metro, bus, parking
- Fields: name, type, distance
```

### OpenWeather API

```
Current Weather:
- Endpoint: /weather
- Data: temp, description, humidity, wind speed

7-Day Forecast:
- Endpoint: /forecast/daily
- Data: min/max temp, precipitation, conditions

Best Filming Months:
- Algorithm: Heuristic based on latitude
- Considers: Temperature ranges, seasonal patterns
```

### Gemini AI

```
Amenity Extraction:
- Model: gemini-2.0-flash-exp
- Input: Location description + address
- Output: 8 boolean amenity flags
- Prompt: "Analyze this location and identify available amenities..."

Budget Estimation:
- Model: gemini-2.0-flash-exp
- Input: Description + address + location type
- Output: Daily rate, range, confidence %, reasoning
- Prompt: "Estimate daily rental cost for this filming location..."

Comparison Recommendation:
- Model: gemini-2.0-flash-exp
- Input: Top 3-5 ranked locations with scores
- Output: Natural language summary
- Prompt: "Analyze these location comparison results..."
```

---

## 🛠️ Troubleshooting Quick Guide

| Issue                     | Likely Cause            | Fix                         |
| ------------------------- | ----------------------- | --------------------------- |
| "No requirements found"   | No requirements created | Create via API (see above)  |
| "No locations to compare" | Locations not linked    | Set `requirementId` via API |
| Weather shows "N/A"       | API key missing         | Add OPENWEATHER_API_KEY     |
| Hotels/restaurants empty  | Google Places error     | Check GOOGLE_PLACES_API_KEY |
| Very slow (>60s)          | First-time enrichment   | Normal for initial run      |
| AI recommendation missing | Gemini error            | Check GEMINI_API_KEY        |
| Tab not visible           | Frontend not running    | Start: `npm run dev`        |
| 401 Unauthorized          | JWT expired             | Re-login to get new token   |

---

## 📞 Support Files

- **Implementation Details:** `LOCATION_COMPARISON_IMPLEMENTATION.md`
- **API Setup:** `LOCATION_COMPARISON_SETUP.md`
- **Testing Guide:** `LOCATION_COMPARISON_TESTING_GUIDE.md`
- **Summary:** `LOCATION_COMPARISON_COMPLETE.md`
- **This File:** `LOCATION_COMPARISON_QUICK_REF.md`

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** October 5, 2025
