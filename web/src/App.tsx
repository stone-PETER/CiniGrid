import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ProjectLayout from "./components/ProjectLayout";
import LoginPage from "./pages/LoginPage";
import ProjectCardsPage from "./pages/ProjectCardsPage";
import BoardScreen from "./pages/BoardScreen";
import ProjectDashboard from "./pages/ProjectDashboard";
import ScenesScreen from "./pages/ScenesScreen";
import TasksScreen from "./pages/TasksScreen";
import LocationsScreen from "./pages/LocationsScreen";
import FinalizedLocations from "./pages/FinalizedLocations";
import MembersSection from "./pages/MembersSection";
import ForbiddenPage from "./pages/ForbiddenPage";
import ScriptAnalysisPage from "./pages/ScriptAnalysisPage";

const App = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Project Cards Page - Landing after login */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ProjectCardsPage />
                  </ProtectedRoute>
                }
              />

              {/* Project Routes with New Layout */}
              <Route
                path="/project/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="board" element={<BoardScreen />} />
                <Route path="script" element={<ScriptAnalysisPage />} />
                <Route path="scenes" element={<ScenesScreen />} />
                <Route path="tasks" element={<TasksScreen />} />
                <Route path="locations" element={<LocationsScreen />} />
                <Route path="members" element={<MembersSection />} />
              </Route>

              {/* Legacy Routes with Old Layout (for backward compatibility) */}
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
                path="/project"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDashboard />
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

              {/* 403 Forbidden Page */}
              <Route path="/forbidden" element={<ForbiddenPage />} />

              {/* 404 fallback - redirect to project cards */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;
