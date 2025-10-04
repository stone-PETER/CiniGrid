# Frontend Integration Guide - Location Scouting Backend APIs

## 🎯 **PROJECT OVERVIEW**

You need to integrate a frontend application with a Location Scouting backend API for a film production ERP system. The backend provides comprehensive location management functionality including AI-powered suggestions, collaborative approval workflows, and location lifecycle management.

## 🔗 **BACKEND API BASE URL**
```
http://localhost:5000/api
```

## 🔐 **AUTHENTICATION SYSTEM**

### JWT Token-Based Authentication
- **Login Required**: All location endpoints require JWT authentication
- **Token Header**: `Authorization: Bearer <jwt_token>`
- **Token Expiry**: 7 days
- **User Roles**: producer, director, manager, scout, crew

### Authentication Endpoints:
```javascript
// Login
POST /api/auth/login
Body: {
  "username": "scout_sara",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "scout_sara", 
      "role": "scout"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// Register
POST /api/auth/register
Body: {
  "username": "new_user",
  "password": "password123",
  "role": "scout"
}
```

### Test Users Available:
- **scout_sara** / password123 (scout)
- **director_mike** / password123 (director)
- **producer_john** / password123 (producer)
- **manager_lisa** / password123 (manager)

## 📊 **DATABASE STRUCTURE & DATA MODELS**

### PotentialLocation Schema:
```javascript
{
  "_id": "ObjectId",
  "title": "String (required)",
  "description": "String (required)",
  "coordinates": {
    "lat": "Number (required)",
    "lng": "Number (required)"
  },
  "region": "String (required)",
  "tags": ["String array"],
  "permits": [{
    "name": "String",
    "required": "Boolean",
    "notes": "String"
  }],
  "images": ["String array - URLs"],
  "addedBy": {
    "_id": "ObjectId",
    "username": "String",
    "role": "String"
  },
  "notes": [{
    "author": "ObjectId (User)",
    "text": "String",
    "role": "String",
    "createdAt": "Date"
  }],
  "approvals": [{
    "userId": "ObjectId (User)",
    "role": "String", 
    "approved": "Boolean",
    "comment": "String",
    "createdAt": "Date"
  }],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### FinalizedLocation Schema:
```javascript
// Same as PotentialLocation plus:
{
  "finalizedBy": {
    "_id": "ObjectId",
    "username": "String",
    "role": "String"
  },
  "finalizedAt": "Date"
}
```

## 🚀 **API ENDPOINTS DOCUMENTATION**

### 1. AI Location Search
```javascript
POST /api/ai/search
Headers: { Authorization: "Bearer <token>" }
Body: {
  "prompt": "Find beach locations for romantic scenes"
}
Response: {
  "success": true,
  "data": {
    "suggestions": [
      {
        "title": "Historic Dutch Colonial House - Fort Kochi",
        "description": "Beautiful 16th-century architecture...",
        "coordinates": { "lat": 9.9658, "lng": 76.2422 },
        "region": "Kochi, Kerala",
        "tags": ["historic", "colonial", "waterfront"],
        "permits": [
          { "name": "Coastal Permit", "required": true, "notes": "..." }
        ],
        "images": ["url1", "url2"],
        "confidence": 0.95
      }
      // Returns 3 suggestions
    ],
    "count": 3
  }
}
```

### 2. Potential Locations Management

#### Add Location (from AI suggestion):
```javascript
POST /api/locations/potential
Headers: { Authorization: "Bearer <token>" }
Body: {
  "suggestionId": "0" // Index from AI suggestions
}
```

#### Add Location (manual data):
```javascript
POST /api/locations/potential
Headers: { Authorization: "Bearer <token>" }
Body: {
  "manualData": {
    "title": "Beach Scene Location",
    "description": "Perfect for romantic sunset scene",
    "coordinates": { "lat": 8.5241, "lng": 76.9366 },
    "region": "Kerala, India",
    "tags": ["beach", "romantic", "sunset"],
    "permits": ["Coastal Permit", "Tourism Dept"], // ⚠️ Can be string array
    "images": ["url1", "url2"]
  }
}
```

#### Get All Potential Locations:
```javascript
GET /api/locations/potential
Headers: { Authorization: "Bearer <token>" }
Response: {
  "success": true,
  "data": {
    "locations": [/* array of locations */],
    "count": 5
  }
}
```

#### Get Single Potential Location:
```javascript
GET /api/locations/potential/:id
Headers: { Authorization: "Bearer <token>" }
```

#### Add Note to Location:
```javascript
POST /api/locations/potential/:id/notes
Headers: { Authorization: "Bearer <token>" }
Body: {
  "text": "This location looks perfect for the opening scene!"
}
```

#### Add Approval to Location:
```javascript
POST /api/locations/potential/:id/approvals
Headers: { Authorization: "Bearer <token>" }
Body: {
  "approved": true,
  "comment": "Approved for budget and timeline"
}
```

#### Finalize Location:
```javascript
POST /api/locations/potential/:id/finalize
Headers: { Authorization: "Bearer <token>" }
// Moves location from potential to finalized table
```

### 3. Finalized Locations

#### Get All Finalized Locations:
```javascript
GET /api/locations/finalized
Headers: { Authorization: "Bearer <token>" }
```

#### Add Note to Finalized Location:
```javascript
POST /api/locations/finalized/:id/notes
Headers: { Authorization: "Bearer <token>" }
Body: {
  "text": "Confirmed shooting dates with location owner"
}
```

### 4. Direct Add Endpoints

#### Direct Add to Potential:
```javascript
POST /api/locations/direct-add/potential
Headers: { Authorization: "Bearer <token>" }
Body: {
  "title": "Studio Location",
  "description": "Professional studio setup",
  "coordinates": { "lat": 19.0760, "lng": 72.8777 },
  "region": "Mumbai",
  "permits": ["Studio Booking", "Equipment Setup"],
  "images": ["studio1.jpg"],
  "tags": ["studio", "professional"]
}
```

#### Direct Add to Finalized:
```javascript
POST /api/locations/direct-add/finalized
Headers: { Authorization: "Bearer <token>" }
Body: {
  // Same as direct add to potential
}
```

## ⚠️ **CRITICAL FRONTEND IMPLEMENTATION NOTES**

### 1. **Permit Data Handling** (IMPORTANT!)
- **Frontend Can Send**: `["Permit 1", "Permit 2"]` (string array)
- **Backend Automatically Converts To**: 
  ```javascript
  [
    { "name": "Permit 1", "required": true, "notes": "" },
    { "name": "Permit 2", "required": true, "notes": "" }
  ]
  ```
- **Frontend Receives Back**: Object array format
- **No Frontend Transformation Needed**: Backend handles conversion

### 2. **Response Format Consistency**
All API responses follow this format:
```javascript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "error": "Error message",
  "details": [/* validation errors if any */]
}
```

### 3. **Required vs Optional Fields**
**Always Required:**
- `title`, `description`, `coordinates` (lat, lng), `region`

**Optional:**
- `tags`, `permits`, `images`

### 4. **User Context**
- Each location includes `addedBy` user information
- Notes include `author` user information
- Approvals include `userId` information

## 🎨 **FRONTEND UI WORKFLOW SUGGESTIONS**

### 1. **AI Search Flow**
```
1. User enters search prompt
2. Call POST /api/ai/search
3. Display 3 suggestions with:
   - Title, description, region
   - Map preview (coordinates)
   - Tags, permits list
   - "Add to Potential" button for each
```

### 2. **Manual Location Addition**
```
Form fields:
- Title* (required)
- Description* (required) 
- Coordinates* (lat/lng or map picker)
- Region* (required)
- Tags (comma-separated or tag input)
- Permits (comma-separated or list input)
- Images (URL inputs or file upload)
```

### 3. **Location Management Dashboard**
```
Tabs:
- Potential Locations (with notes/approvals)
- Finalized Locations
- AI Search

Each location card shows:
- Basic info + map thumbnail
- Notes count, approvals count
- Actions: View Details, Add Note, Approve, Finalize
```

### 4. **Location Detail View**
```
- Full location information
- Interactive map
- Notes section (chronological)
- Approvals section (by user role)
- Action buttons based on user role
```

## 🧪 **TESTING SCENARIOS**

### 1. **Basic Flow Test**
```javascript
// Test sequence
1. Login as scout_sara
2. Search for "beach locations"
3. Add suggestion #0 to potential
4. Add note to location
5. Login as director_mike
6. Approve the location
7. Finalize the location
8. Verify in finalized list
```

### 2. **Error Handling Test**
```javascript
// Test missing required fields
POST /api/locations/potential
Body: {
  "manualData": {
    "title": "Test"
    // Missing description, coordinates, region
  }
}
// Should return validation error
```

## 🛠️ **IMPLEMENTATION CHECKLIST**

### Frontend Tasks:
- [ ] Implement JWT token storage/management
- [ ] Create login/authentication flow
- [ ] Build AI search interface
- [ ] Create location forms (manual entry)
- [ ] Implement location cards/list views
- [ ] Add map integration for coordinates
- [ ] Build notes/comments system
- [ ] Create approval workflow UI
- [ ] Implement location finalization
- [ ] Add error handling for all API calls
- [ ] Test with all user roles

### Key Integration Points:
- [ ] Axios/Fetch setup with JWT headers
- [ ] Form validation matching backend requirements
- [ ] State management for locations data
- [ ] Real-time updates for collaborative features
- [ ] Map integration (Google Maps/Mapbox)
- [ ] File upload for images (if needed)

## 📞 **API TESTING COMMANDS**

Use these curl commands to test the backend:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"scout_sara","password":"password123"}'

# Add location
curl -X POST http://localhost:5000/api/locations/potential \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"manualData":{"title":"Test","description":"Test","coordinates":{"lat":10.0,"lng":76.0},"region":"Test"}}'
```

## 🎯 **SUCCESS CRITERIA**

Your frontend integration is successful when:
1. ✅ Users can login and get authenticated
2. ✅ AI search returns and displays 3 suggestions
3. ✅ Locations can be added from suggestions or manual entry
4. ✅ Notes and approvals can be added to locations
5. ✅ Locations can be finalized and appear in finalized list
6. ✅ All user roles work with appropriate permissions
7. ✅ Data persists correctly between sessions
8. ✅ Map coordinates display properly
9. ✅ Permit arrays are handled correctly (string → object conversion)
10. ✅ Error states are handled gracefully

The backend is fully tested and working - focus on building a clean, intuitive UI that leverages these robust APIs for the location scouting workflow!