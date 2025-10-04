# Location Scouting Platform

A React + TypeScript + Tailwind CSS frontend application for location scouting with AI-powered search capabilities.

## Features

- 🔍 **AI-Powered Location Search**: Search for locations using natural language descriptions
- 📍 **Location Management**: Add, manage, and track potential and finalized locations
- 👥 **Role-Based Access**: Support for Scout, Manager, and Admin roles
- 📝 **Notes & Approvals**: Collaborative note-taking and approval workflow
- 🗺️ **Map Integration**: Google Maps integration for location visualization
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- 🔄 **Mock API Support**: Built-in mock API for development and testing

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **State Management**: React Hooks + Context API

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and navigate to the project**:
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3000
   
   # Mock API (set to 'true' to use mock data instead of real backend)
   VITE_USE_MOCK_API=true
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_USE_MOCK_API` | Use mock API instead of real backend | `true` |

## Demo Credentials

When using the mock API (`VITE_USE_MOCK_API=true`), you can log in with:

- **Scout**: username: `scout1`, role: `scout`
- **Manager**: username: `manager1`, role: `manager`  
- **Admin**: username: `admin1`, role: `admin`

*Password can be anything when using mock API*

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── SearchBox.tsx
│   ├── SuggestionsList.tsx
│   ├── PotentialLocationsList.tsx
│   ├── PotentialDetailPanel.tsx
│   ├── DirectAddForm.tsx
│   └── ProtectedRoute.tsx
├── pages/               # Page components
│   ├── LoginPage.tsx
│   ├── ScoutDashboard.tsx
│   └── FinalizedLocations.tsx
├── services/            # API services
│   ├── api.ts          # Axios instance
│   ├── locationService.ts  # API wrapper functions
│   └── mockApi.ts      # Mock API implementation
├── context/             # React contexts
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
│   └── useLocations.ts
├── types/               # TypeScript type definitions
│   └── index.ts
└── App.tsx             # Main app component
```

## Key Features & Usage

### 1. Authentication
- Login/Register with role selection (Scout, Manager, Admin)
- Protected routes with automatic redirect
- Token-based authentication with localStorage

### 2. Location Search
- AI-powered search using natural language descriptions
- Returns 3 suggestions with details, permits, and coordinates
- One-click addition to potential locations

### 3. Location Management
- **Potential Locations**: Manage locations under consideration
- **Finalized Locations**: View approved, ready-to-use locations
- **Direct Add**: Manually add locations with coordinates

### 4. Collaboration Features
- **Notes**: Add contextual notes to locations
- **Approvals**: Manager/Admin approval workflow
- **Role-based permissions**: Different access levels

### 5. Map Integration
- Google Maps integration for location visualization
- Click to open full map view in new tab
- Coordinate display and validation

## API Integration

The app supports both real backend APIs and mock data:

### Backend API Endpoints

When `VITE_USE_MOCK_API=false`, the app expects these endpoints:

```
POST /auth/login           # User authentication
POST /auth/register        # User registration
POST /auth/logout          # User logout

POST /api/ai/search        # AI location search
GET  /api/locations/potential    # Get potential locations
GET  /api/locations/potential/:id  # Get location details
POST /api/locations/potential     # Add potential location
GET  /api/locations/finalized     # Get finalized locations
POST /api/locations/potential/:id/finalize  # Finalize location
POST /api/locations/direct-add    # Direct add location

GET  /api/locations/:id/notes     # Get location notes
POST /api/locations/:id/notes     # Add note
GET  /api/locations/:id/approvals # Get approvals
POST /api/locations/:id/approvals # Add approval
```

### Mock API

When `VITE_USE_MOCK_API=true`, the app uses built-in mock data for:
- Sample suggestions with realistic location data
- Pre-populated potential and finalized locations
- Notes and approvals simulation
- Realistic API response delays

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React and TypeScript
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Organization**: Type imports separated with `import type`

## Deployment

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Setup

For production deployment:

1. Set `VITE_USE_MOCK_API=false`
2. Configure `VITE_API_BASE_URL` to point to your backend
3. Ensure backend API implements the expected endpoints

## Troubleshooting

### Common Issues

1. **Mock API not working**: Ensure `VITE_USE_MOCK_API=true` in `.env`
2. **API calls failing**: Check backend URL and CORS configuration
3. **Authentication issues**: Verify token storage and API interceptors
4. **Map not loading**: Check Google Maps API key (if using real maps)

### Development Notes

- The app automatically falls back to mock API if real API calls fail
- Authentication tokens are stored in localStorage
- Map coordinates use sample NYC locations in mock data
- Error boundaries handle API failures gracefully

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details