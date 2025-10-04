# Frontend Timeout Improvements

## Problem

Frontend was falling back to mock API too quickly before the backend AI Agent could complete its operations.

## Root Cause

- **Previous timeout**: 10 seconds (10000ms)
- **AI operations require**:
  - Google Places API search: 1-3 seconds
  - Gemini AI ranking: 5-15 seconds
  - MongoDB caching: 1-2 seconds
  - **Total**: 10-30 seconds depending on query complexity

## Solutions Applied

### 1. Global API Timeout Increase

**File**: `web/src/services/api.ts`

```typescript
// Changed from 10000ms to 30000ms
timeout: 30000, // 30 seconds - AI operations need more time
```

### 2. Specific AI Search Timeout

**File**: `web/src/services/locationService.ts`

```typescript
// AI search gets even longer timeout
const response = await api.post("/ai/search", searchRequest, {
  timeout: 45000, // 45 seconds for AI operations
});
```

### 3. User Feedback Improvement

**File**: `web/src/components/SearchBox.tsx`

- Button text changes to "Searching with AI..." during loading
- Added informative message: "🤖 AI is analyzing locations with Google Places and Gemini... This may take 20-30 seconds."

## Timeline Breakdown

### Normal AI Search Flow (15-25 seconds)

1. **0-2s**: Request validation, auth check
2. **2-5s**: Google Places API search for locations
3. **5-20s**: Gemini AI analyzes and ranks locations
4. **20-22s**: MongoDB cache save (non-blocking)
5. **22-25s**: Response formatting and return

### Cached Results (< 1 second)

- If description hash exists in cache
- Direct MongoDB lookup
- No API calls needed

## Backend Improvements Already in Place

### Non-blocking Cache

```javascript
// Cache failures don't block AI results
try {
  await newRecommendation.save();
  cacheStatus = "saved";
} catch (cacheError) {
  console.warn("⚠️ Failed to cache AI recommendation:", cacheError.message);
  cacheStatus = "failed";
  // Continue anyway - results still returned
}
```

### JSON Recovery

- Aggressive JSON parsing with multiple fallback strategies
- Handles truncated responses
- Removes trailing commas
- Extracts complete objects only

## Testing

### Test the Timeout Fix

```bash
cd web
node test-connection.js
```

### Monitor Real Search Time

1. Open browser DevTools (F12)
2. Go to Network tab
3. Search for a location
4. Check the `/api/ai/search` request timing

### Expected Results

- ✅ No timeout errors
- ✅ Results return in 15-30 seconds (first search)
- ✅ Results return in < 1 second (cached searches)
- ✅ User sees helpful loading message
- ✅ No fallback to mock API (unless real error occurs)

## Future Optimizations

### 1. Streaming Responses

Consider implementing SSE (Server-Sent Events) for real-time progress updates:

- "Searching Google Places..."
- "Found 15 locations"
- "Analyzing with AI..."
- "Ranking complete"

### 2. Progressive Results

Return partial results as they're processed:

- Send Google Places results immediately
- Stream Gemini rankings as they complete

### 3. Background Caching

Pre-cache common searches:

- "modern office"
- "outdoor park"
- "restaurant interior"

### 4. Request Queuing

If multiple searches happen simultaneously:

- Queue them
- Show position in queue
- Estimate wait time

## Configuration

### Environment Variables

```env
# Backend - no timeout needed (Express default is no timeout)

# Frontend - handled in code
# VITE_API_TIMEOUT - not used, handled in api.ts
```

### Timeout Hierarchy

1. **AI Search**: 45 seconds (most time needed)
2. **General API**: 30 seconds (standard operations)
3. **Backend**: No timeout (lets AI complete)

## Monitoring

### Signs of Timeout Issues

- "Network Error" in console
- Fallback to mock data message
- Request shows "cancelled" in DevTools

### Signs of Success

- "AI search results" log in console
- Real location data with Google Place IDs
- Cache status in backend logs
- No fallback messages

## Related Files

- `web/src/services/api.ts` - Global timeout config
- `web/src/services/locationService.ts` - AI-specific timeout
- `web/src/components/SearchBox.tsx` - User feedback
- `backend/services/aiAgent.js` - AI operations
- `backend/controllers/aiController.js` - Request handling

## Date Applied

October 4, 2025
