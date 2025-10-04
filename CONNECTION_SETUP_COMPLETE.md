# Frontend-Backend Connection Configuration

## ✅ Connection Status: WORKING

All frontend-backend connections are properly configured and tested.

## Configuration Summary

### Backend (Port 5000)

- **URL**: `http://localhost:5000`
- **API Base**: `http://localhost:5000/api`
- **CORS**: Configured for `http://localhost:5173`

### Frontend (Port 5173)

- **URL**: `http://localhost:5173`
- **API URL**: `http://localhost:5000/api`
- **Configured in**: `.env` → `VITE_API_URL`

## Changes Made

### 1. Fixed `web/src/services/api.ts`

**Before:**

```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
```

**After:**

```typescript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
```

**Reason**: Environment variable name was incorrect (`VITE_API_BASE_URL` vs `VITE_API_URL`)

### 2. Fixed `web/vite.config.ts`

**Before:**

```typescript
server: {
  port: 3001; // Use port 3001 since 3000 is taken by backend
}
```

**After:**

```typescript
server: {
  port: 5173,  // Match the port expected by backend CORS
  host: true
}
```

**Reason**: Backend CORS is configured for port 5173, frontend was using 3001

### 3. Created `web/test-connection.js`

Comprehensive test script that validates:

- Backend server is running
- CORS headers are correct
- API endpoints are accessible
- Environment configuration is correct

## Test Results

```
✓ All tests passed: 7/7 (100.0%)
✓ Frontend and backend are properly connected!

Tests:
  ✓ Backend Server Status
  ✓ CORS Configuration
  ✓ POST /auth/login - Status: 400 (endpoint exists, needs data)
  ✓ POST /ai/search - Status: 401 (endpoint exists, needs auth)
  ✓ GET /locations/potential - Status: 401 (endpoint exists, needs auth)
  ✓ GET /ai-agent/status - Status: 200 (working)
  ✓ Environment Configuration
```

## Environment Files

### Backend `.env`

```properties
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=dev_jwt_secret_key...
GEMINI_API_KEY=AIzaSyC...
GOOGLE_MAPS_API_KEY=AIzaSyC...
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```properties
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Server will start on: `http://localhost:5000`

### Start Frontend

```bash
cd web
npm run dev
```

Frontend will start on: `http://localhost:5173`

### Test Connection

```bash
cd web
node test-connection.js
```

## API Endpoints

All endpoints are prefixed with `/api`:

| Endpoint                            | Method | Auth | Description              |
| ----------------------------------- | ------ | ---- | ------------------------ |
| `/auth/login`                       | POST   | No   | User login               |
| `/auth/register`                    | POST   | No   | User registration        |
| `/ai/search`                        | POST   | Yes  | AI location search       |
| `/locations/potential`              | GET    | Yes  | Get potential locations  |
| `/locations/potential/:id`          | GET    | Yes  | Get location details     |
| `/locations/potential/:id/finalize` | POST   | Yes  | Finalize location        |
| `/locations/finalized`              | GET    | Yes  | Get finalized locations  |
| `/locations/direct-add/potential`   | POST   | Yes  | Add location directly    |
| `/ai-agent/status`                  | GET    | No   | Check AI agent status    |
| `/api/locations/analyze`            | POST   | Yes  | Analyze location with AI |
| `/api/locations/:id/similar`        | GET    | Yes  | Find similar locations   |
| `/api/locations/search`             | POST   | Yes  | AI-enhanced search       |

## CORS Configuration

Backend CORS settings in `index.js`:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
```

**Allows:**

- Origin: `http://localhost:5173`
- Credentials: Yes (cookies, auth headers)
- Methods: All standard methods
- Headers: All standard headers

## Authentication Flow

1. **Login** → POST `/api/auth/login`

   - Receives JWT token
   - Stores in `localStorage` as `auth_token`

2. **API Requests** → Includes token

   ```typescript
   headers: {
     Authorization: `Bearer ${token}`;
   }
   ```

3. **Token Validation** → Backend middleware

   - Validates JWT on protected routes
   - Returns 401 if invalid/missing

4. **Logout** → Clears localStorage
   ```typescript
   localStorage.removeItem("auth_token");
   localStorage.removeItem("user");
   ```

## Error Handling

### Frontend (`api.ts`)

```typescript
// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Backend (`index.js`)

```javascript
// Global error handler
app.use((error, req, res, next) => {
  // Handle validation errors
  // Handle duplicate keys
  // Handle JWT errors
  // Handle cast errors
  // Default 500 error
});
```

## Mock API Fallback

Frontend has fallback to mock API when backend is unavailable:

```typescript
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";
```

Set in `.env`:

```properties
VITE_USE_MOCK_API=false  # Use real backend
VITE_USE_MOCK_API=true   # Use mock data
```

## Response Format

All API responses follow consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional details"
}
```

## Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**

1. Check backend is running: `npm run dev` in backend folder
2. Verify port 5000 is not in use
3. Check MongoDB connection

### Issue: "CORS error"

**Solution:**

1. Frontend must be on port 5173
2. Check `FRONTEND_URL` in backend `.env`
3. Clear browser cache

### Issue: "401 Unauthorized"

**Solution:**

1. Login to get JWT token
2. Check token is stored in localStorage
3. Verify token hasn't expired (7 days default)

### Issue: "Network Error"

**Solution:**

1. Check both servers are running
2. Verify `.env` files are correct
3. Run `node test-connection.js` to diagnose

## Testing

### Manual Testing

```bash
# Test backend directly
curl http://localhost:5000

# Test auth endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test with authentication
curl http://localhost:5000/api/locations/potential \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Testing

```bash
# Backend tests
cd backend
node test-index.js

# Connection test
cd web
node test-connection.js
```

## Production Deployment

### Environment Variables to Update

**Backend:**

```properties
PORT=5000
NODE_ENV=production
MONGO_URI=<production-mongodb-uri>
JWT_SECRET=<strong-production-secret>
FRONTEND_URL=<production-frontend-url>
GEMINI_API_KEY=<production-key>
GOOGLE_MAPS_API_KEY=<production-key>
```

**Frontend:**

```properties
VITE_API_URL=<production-backend-url>/api
VITE_SOCKET_URL=<production-backend-url>
```

### Build Commands

**Backend:**

```bash
# No build needed (Node.js)
npm install --production
npm start
```

**Frontend:**

```bash
npm run build
# Output in dist/ folder
```

## Security Considerations

1. **JWT Secret**: Use strong secret in production
2. **CORS**: Restrict to specific domain in production
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Add rate limiting to API
5. **Input Validation**: All inputs validated on backend

## Performance Optimization

1. **API Caching**: 7-day cache for AI results
2. **Connection Pooling**: MongoDB connection pooling enabled
3. **Compression**: Enable gzip compression
4. **CDN**: Serve frontend from CDN in production

---

**Status**: ✅ Fully Configured and Tested  
**Last Updated**: 2025-01-22  
**Test Results**: 7/7 passing (100%)  
**Ready for Development**: Yes
