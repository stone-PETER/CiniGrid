import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import BoardScreen from './pages/BoardScreen';
import ScenesScreen from './pages/ScenesScreen';
import TasksScreen from './pages/TasksScreen';
import LocationsScreen from './pages/LocationsScreen';
import FinalizedLocations from './pages/FinalizedLocations';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes with Layout */}
            <Route 
              path="/board" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BoardScreen />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/scenes" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ScenesScreen />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TasksScreen />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/locations" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <LocationsScreen />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy routes for backward compatibility */}
            <Route 
              path="/scout" 
              element={<Navigate to="/locations" replace />}
            />
            <Route 
              path="/finalized" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <FinalizedLocations />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect to Board (Home) */}
            <Route path="/" element={<Navigate to="/board" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App
