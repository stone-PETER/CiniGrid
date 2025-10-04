import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ScoutDashboard from './pages/ScoutDashboard';
import FinalizedLocations from './pages/FinalizedLocations';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/scout" 
              element={
                <ProtectedRoute>
                  <ScoutDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/finalized" 
              element={
                <ProtectedRoute>
                  <FinalizedLocations />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/scout" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/scout" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App
