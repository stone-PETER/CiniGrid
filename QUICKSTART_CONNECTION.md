# Quick Start: Frontend-Backend Connection

## ✅ Status: CONFIGURED

Frontend and backend are properly connected and tested.

## URLs

- **Backend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Frontend**: http://localhost:5173

## Quick Start

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd web
npm run dev

# Terminal 3: Test Connection (optional)
cd web
node test-connection.js
```

## Key Configuration

### Backend

- Port: 5000
- CORS: http://localhost:5173
- File: `backend/.env`

### Frontend

- Port: 5173
- API URL: http://localhost:5000/api
- File: `web/.env`

## Files Changed

1. **`web/src/services/api.ts`**

   - Fixed: `VITE_API_URL` (was `VITE_API_BASE_URL`)
   - Fixed: Default to `http://localhost:5000/api`

2. **`web/vite.config.ts`**

   - Fixed: Port 5173 (was 3001)
   - Added: `host: true`

3. **`web/test-connection.js`** _(new)_
   - Tests backend connection
   - Validates CORS
   - Checks all endpoints

## Test Results

```
✓ All tests passed: 7/7 (100.0%)
```

## Troubleshooting

**Backend not responding?**

```bash
cd backend && npm run dev
```

**Port conflict?**

- Backend: PORT=5000 in backend/.env
- Frontend: port: 5173 in web/vite.config.ts

**CORS errors?**

- Frontend must use port 5173
- Backend CORS set to http://localhost:5173

**API not found?**

- Check VITE_API_URL=http://localhost:5000/api in web/.env

## Common Commands

```bash
# Test backend
curl http://localhost:5000

# Test API endpoint
curl http://localhost:5000/api/ai-agent/status

# Run connection tests
cd web && node test-connection.js

# Run backend tests
cd backend && node test-index.js
```

## Documentation

- **Full Setup**: `CONNECTION_SETUP_COMPLETE.md`
- **Backend Tests**: `backend/TEST_INDEX_COMPLETE.md`
- **AI Features**: `backend/AI_LOCATION_ROUTES.md`

---

**Ready to develop!** 🚀
