# Location Comparison Tool - API Setup Guide

This guide will help you configure the required API keys for the Location Comparison feature.

## 📋 Overview

The Location Comparison tool uses three external APIs:

1. **Google Places API** (✅ Already configured) - For nearby hotels, restaurants, parking, transit
2. **OpenWeatherMap API** (⚠️ Needs setup) - For weather data and forecasts
3. **Gemini AI** (✅ Already configured) - For amenity extraction and expense estimation

---

## 🔑 API Keys Required

### 1. Google Places API (REQUIRED)

**Status:** ✅ Already configured

**What it does:**

- Finds nearby hotels (top 5 within 3 miles)
- Finds nearby restaurants (top 5 within 3 miles)
- Locates public transportation (metro, bus stops)
- Finds parking facilities
- Calculates distances between locations

**Current Key:** `GOOGLE_PLACES_API_KEY` in `.env`

---

### 2. OpenWeatherMap API (REQUIRED)

**Status:** ⚠️ **NEEDS SETUP**

**What it does:**

- Current weather conditions
- 7-day weather forecast
- Best filming months based on climate
- Temperature, precipitation, wind data

#### Setup Instructions:

**Step 1: Create Free Account**

1. Go to: https://openweathermap.org/api
2. Click "Sign Up" (top right)
3. Fill in your details (Name, Email, Password)
4. Verify your email address

**Step 2: Generate API Key**

1. Log in to your account
2. Go to: https://home.openweathermap.org/api_keys
3. You'll see a default API key already created
4. Copy the API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

**Step 3: Activate API Key**

- **Important:** New API keys take 10-60 minutes to activate
- You'll receive an email when it's ready
- Test it after activation

**Step 4: Add to Environment Variables**

Open your `backend/.env` file and add:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual key.

**Step 5: Restart Backend Server**

```powershell
# Stop the backend (Ctrl+C in terminal)
# Then restart:
cd backend
npm run dev
```

#### Free Tier Limits:

- ✅ **1,000 API calls per day** (more than enough)
- ✅ **Current weather** - Included
- ✅ **5-day/3-hour forecast** - Included
- ✅ No credit card required

#### Testing Your Setup:

```powershell
# Test API key (replace YOUR_KEY with your actual key):
$apiKey = "YOUR_KEY"
$url = "https://api.openweathermap.org/data/2.5/weather?q=Los Angeles&appid=$apiKey&units=imperial"
Invoke-RestMethod -Uri $url
```

If successful, you'll see weather data for Los Angeles.

---

### 3. Gemini AI (OPTIONAL)

**Status:** ✅ Already configured

**What it does:**

- Extracts amenities from location descriptions (parking, WiFi, power, kitchen, etc.)
- Estimates location rental costs based on description and address
- Generates AI recommendations for location comparison

**Current Key:** `GEMINI_API_KEY` in `.env`

**Note:** If not configured, the system will:

- Skip amenity auto-extraction (users can manually enter)
- Skip expense estimation (users can manually enter)
- Skip AI recommendations
- Core comparison features will still work

---

## 🚀 Quick Start Checklist

- [x] **Google Places API** - Already configured ✅
- [ ] **OpenWeather API** - Set up now (5 minutes) ⚠️
- [x] **Gemini AI** - Already configured ✅

---

## 🧪 Testing the Complete Setup

### Test 1: Check Environment Variables

```powershell
cd backend
cat .env | Select-String "API_KEY"
```

You should see:

```
GEMINI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
OPENWEATHER_API_KEY=...  ← Make sure this exists!
```

### Test 2: Test Location Comparison API

**Prerequisites:**

1. Backend running (`npm run dev`)
2. You have a project with potential locations
3. You've created a location requirement

**API Test:**

```powershell
# Get your auth token from browser DevTools (localStorage)
$token = "YOUR_AUTH_TOKEN"
$projectId = "YOUR_PROJECT_ID"

# Create a location requirement
$body = @{
  projectId = $projectId
  prompt = "Modern coffee shop"
  priority = "High"
  budget = @{ max = 1000 }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/locations/requirements" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

### Test 3: Run Comparison

```powershell
# Use the requirementId from Test 2
$requirementId = "..."

# Run comparison
$compareBody = @{
  weights = @{
    budget = 30
    similarity = 35
    crewAccess = 20
    transportation = 15
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/locations/compare/$requirementId" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $compareBody
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Compared X locations",
  "data": {
    "locations": [...],  // Ranked locations with scores
    "recommendation": "AI recommendation text...",
    "requirement": {...},
    "weights": {...}
  }
}
```

---

## 📊 Feature Availability Matrix

| Feature                | Without OpenWeather | With OpenWeather |
| ---------------------- | ------------------- | ---------------- |
| Location Comparison    | ✅ Yes              | ✅ Yes           |
| Budget Scoring         | ✅ Yes              | ✅ Yes           |
| Similarity Scoring     | ✅ Yes              | ✅ Yes           |
| Crew Access Scoring    | ✅ Yes              | ✅ Yes           |
| Transportation Scoring | ✅ Yes              | ✅ Yes           |
| Weather Data           | ❌ No               | ✅ Yes           |
| Forecast               | ❌ No               | ✅ Yes           |
| Best Filming Months    | ❌ No               | ✅ Yes           |

**Bottom Line:** OpenWeather API is **highly recommended** but not strictly required. The comparison tool will work without it, but you'll miss weather insights.

---

## 🔧 Troubleshooting

### Issue: "OpenWeather API key not configured"

**Solution:** Check your `.env` file has `OPENWEATHER_API_KEY=...`

### Issue: "Error 401: Invalid API key"

**Causes:**

1. API key not activated yet (wait 10-60 minutes after creation)
2. Typo in API key
3. Extra spaces in `.env` file

**Solution:**

```env
# ❌ Wrong (has spaces):
OPENWEATHER_API_KEY = your_key_here

# ✅ Correct (no spaces):
OPENWEATHER_API_KEY=your_key_here
```

### Issue: "Error 429: Too many requests"

**Cause:** You've exceeded the free tier limit (1,000 calls/day)

**Solution:**

- Wait until tomorrow (limit resets daily)
- Upgrade to paid tier if needed
- Check for infinite loops calling the API

### Issue: Weather data shows "Unknown"

**Causes:**

1. API key not set
2. Location has no coordinates
3. API is down

**Solution:**

1. Check API key in `.env`
2. Verify location has valid lat/lng coordinates
3. Test API manually with curl/Postman

---

## 💰 Cost Estimates

### Google Places API

- **Your Usage:** ~10-20 calls per location comparison
- **Pricing:** $0.017 per request (Nearby Search)
- **Estimate:** $0.17-0.34 per comparison
- **Free Tier:** $200 credit/month = ~1,000+ comparisons free

### OpenWeatherMap API

- **Your Usage:** 3 calls per location comparison
- **Pricing:** FREE up to 1,000 calls/day
- **Estimate:** $0.00 (within free tier)
- **Paid Tier:** $0.0015 per call if you exceed

### Gemini AI

- **Your Usage:** 2-3 calls per location (amenities + expense)
- **Pricing:** Free tier is generous
- **Estimate:** Minimal cost

**Total Monthly Cost Estimate:** $5-20 for typical usage

---

## ✅ Success Criteria

Your setup is complete when:

1. ✅ `.env` file has all three API keys
2. ✅ Backend starts without warnings about missing keys
3. ✅ Location comparison returns enriched data with:
   - Nearby hotels listed
   - Nearby restaurants listed
   - Transportation info
   - Weather data (current + forecast)
   - Budget estimates
   - Amenities extracted
4. ✅ Comparison table shows all scores
5. ✅ AI recommendation appears

---

## 📞 Support

**If you encounter issues:**

1. Check this guide first
2. Verify all API keys in `.env`
3. Check backend console for error messages
4. Test each API independently (see Testing sections above)

**Common Error Messages:**

| Error                    | Cause                      | Fix                               |
| ------------------------ | -------------------------- | --------------------------------- |
| "API key not configured" | Missing `.env` variable    | Add key to `.env`                 |
| "Invalid API key"        | Wrong key or not activated | Re-check key, wait for activation |
| "Location not found"     | Invalid coordinates        | Verify lat/lng exist              |
| "Failed to fetch"        | Network issue              | Check internet, try again         |

---

## 🎬 Ready to Use!

Once setup is complete:

1. Go to Locations page in your project
2. Create a Location Requirement (with notes, budget, priority)
3. Add potential locations to that requirement
4. Click **"Compare Locations"** button
5. View side-by-side comparison table with AI insights!

Enjoy your intelligent location scouting! 🚀
