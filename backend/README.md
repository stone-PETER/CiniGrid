# Location Scouting Backend API

A comprehensive Express.js backend for a film production ERP's Location Scouting module. This API provides functionality for AI-powered location suggestions, user management, and collaborative location approval workflows.

## 🏗️ Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with **bcryptjs** password hashing
- **CORS** enabled for frontend integration
- **ESModules** (ES6 imports)

## 📁 Project Structure

```
backend/
├── controllers/          # Request handlers and business logic
│   ├── authController.js
│   ├── aiController.js
│   ├── locationsController.js
│   └── notesController.js
├── middleware/           # Authentication and validation middleware
│   └── auth.js
├── models/              # MongoDB schemas
│   ├── User.js
│   ├── LocationSuggestion.js
│   ├── PotentialLocation.js
│   └── FinalizedLocation.js
├── routes/              # API route definitions
│   ├── auth.js
│   ├── ai.js
│   └── locations.js
├── scripts/             # Database utilities
│   └── seed.js
├── services/            # Business logic services
│   └── mockAiService.js
├── .env                 # Environment variables
├── package.json
└── index.js             # Application entry point
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create or update `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/locationdb?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Seed the database with sample users**
   ```bash
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 👥 Sample Users

After running the seed script, the following test users will be available:

| Username | Password | Role |
|----------|----------|------|
| producer_john | password123 | producer |
| scout_sara | password123 | scout |
| director_mike | password123 | director |
| manager_lisa | password123 | manager |

## 📊 Data Models

### User
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  role: String (producer|director|manager|scout|crew)
}
```

### LocationSuggestion (AI-generated, not persisted)
```javascript
{
  title: String,
  description: String,
  coordinates: { lat: Number, lng: Number },
  region: String,
  tags: [String],
  permits: [{ name: String, required: Boolean, notes: String }],
  images: [String],
  confidence: Number,
  createdAt: Date
}
```

### PotentialLocation
```javascript
{
  title: String,
  description: String,
  coordinates: { lat: Number, lng: Number },
  region: String,
  permits: [{ name: String, required: Boolean, notes: String }],
  images: [String],
  tags: [String],
  addedBy: ObjectId (User),
  notes: [{ author: ObjectId, text: String, role: String, createdAt: Date }],
  approvals: [{ userId: ObjectId, role: String, approved: Boolean, comment: String, createdAt: Date }]
}
```

### FinalizedLocation
```javascript
{
  // Same as PotentialLocation plus:
  finalizedBy: ObjectId (User),
  finalizedAt: Date
}
```

## 🔗 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "new_user",
  "password": "password123",
  "role": "scout"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a9b123456789",
      "username": "new_user",
      "role": "scout"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "scout_sara",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a9b123456789",
      "username": "scout_sara",
      "role": "scout"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### AI Location Search

#### Get AI Suggestions
```http
POST /api/ai/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Find historic colonial buildings near water for period drama"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt": "Find historic colonial buildings near water for period drama",
    "suggestions": [
      {
        "title": "Historic Dutch Colonial House - Fort Kochi",
        "description": "Beautiful 16th-century Dutch colonial architecture...",
        "coordinates": { "lat": 9.9658, "lng": 76.2422 },
        "region": "Kochi, Kerala",
        "tags": ["historic", "colonial", "waterfront"],
        "permits": [
          {
            "name": "Coastal Regulation Zone Clearance",
            "required": true,
            "notes": "Required for filming near coastal areas"
          }
        ],
        "images": ["https://example.com/images/dutch-house-1.jpg"],
        "confidence": 0.95,
        "createdAt": "2024-10-04T10:30:00.000Z"
      }
    ],
    "count": 3
  }
}
```

### Location Management

#### Add AI Suggestion to Potential
```http
POST /api/locations/potential
Authorization: Bearer <token>
Content-Type: application/json

{
  "suggestionId": "0"
}
```

#### Add Manual Location to Potential
```http
POST /api/locations/potential
Authorization: Bearer <token>
Content-Type: application/json

{
  "manualData": {
    "title": "Custom Location",
    "description": "Manually added location",
    "coordinates": { "lat": 10.0, "lng": 76.0 },
    "region": "Kerala",
    "permits": [],
    "images": [],
    "tags": ["custom"]
  }
}
```

#### Get All Potential Locations
```http
GET /api/locations/potential
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "64f8a9b123456789",
        "title": "Historic Dutch Colonial House - Fort Kochi",
        "description": "Beautiful 16th-century Dutch colonial architecture...",
        "coordinates": { "lat": 9.9658, "lng": 76.2422 },
        "region": "Kochi, Kerala",
        "addedBy": {
          "_id": "64f8a9b123456789",
          "username": "scout_sara",
          "role": "scout"
        },
        "notes": [],
        "approvals": [],
        "createdAt": "2024-10-04T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### Get Single Potential Location
```http
GET /api/locations/potential/:id
Authorization: Bearer <token>
```

#### Finalize Potential Location
```http
POST /api/locations/potential/:id/finalize
Authorization: Bearer <token>
```

#### Get All Finalized Locations
```http
GET /api/locations/finalized
Authorization: Bearer <token>
```

### Notes and Approvals

#### Add Note to Potential Location
```http
POST /api/locations/potential/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "This location looks perfect for the opening scene!"
}
```

#### Add Note to Finalized Location
```http
POST /api/locations/finalized/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Confirmed shooting dates with location owner"
}
```

#### Add Approval to Potential Location
```http
POST /api/locations/potential/:id/approvals
Authorization: Bearer <token>
Content-Type: application/json

{
  "approved": true,
  "comment": "Approved for budget and timeline"
}
```

### Direct Add Endpoints

#### Direct Add to Potential
```http
POST /api/locations/direct-add/potential
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Direct Added Location",
  "description": "Added directly without AI suggestion",
  "coordinates": { "lat": 10.0, "lng": 76.0 },
  "region": "Kerala",
  "permits": [],
  "images": [],
  "tags": ["direct"]
}
```

#### Direct Add to Finalized
```http
POST /api/locations/direct-add/finalized
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Direct Finalized Location",
  "description": "Added directly to finalized list",
  "coordinates": { "lat": 10.0, "lng": 76.0 },
  "region": "Kerala",
  "permits": [],
  "images": [],
  "tags": ["finalized"]
}
```

## 🔐 Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🧪 Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"password123","role":"scout"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"scout_sara","password":"password123"}'
```

### Get AI suggestions:
```bash
curl -X POST http://localhost:5000/api/ai/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"prompt":"Find beach locations for romantic scenes"}'
```

### Add suggestion to potential:
```bash
curl -X POST http://localhost:5000/api/locations/potential \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"suggestionId":"0"}'
```

## 📋 Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample users

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | Required |
| JWT_SECRET | JWT signing secret | Required |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## 🎯 Features

- ✅ JWT-based authentication
- ✅ Role-based user management
- ✅ Mock AI location suggestions
- ✅ Collaborative approval workflow
- ✅ Notes and comments system
- ✅ Location lifecycle management (potential → finalized)
- ✅ Comprehensive error handling
- ✅ CORS enabled for frontend integration
- ✅ Validation and sanitization
- ✅ Consistent API response format

## 🚀 Next Steps

To extend this API, consider adding:
- Real AI integration (OpenAI, Google Places API)
- Image upload functionality
- Project-based location organization
- Email notifications for approvals
- Location availability calendar
- Budget tracking per location
- Advanced search and filtering
- WebSocket support for real-time updates