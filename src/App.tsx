import type { ReactElement } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LiveNexusDataProvider } from "@/contexts/LiveNexusDataContext";
import { SeroProvider } from "@/contexts/SeroProvider";
import AboutPage from "@/pages/AboutPage";
import AureonLandingPage from "@/pages/AureonLandingPage";
import HomePage from "@/pages/HomePage";
import LiveStreamsPage from "@/pages/LiveStreamsPage";
import LoginPage from "@/pages/LoginPage";
import QGITALandingPage from "@/pages/QGITALandingPage";
import ResourcesPage from "@/pages/ResourcesPage";
import RitualPage from "@/pages/RitualPage";
import ScrollsPage from "@/pages/ScrollsPage";
import SupportPage from "@/pages/SupportPage";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/streams"
                element={
                  <ProtectedRoute>
                    <LiveStreamsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/scrolls" element={<ScrollsPage />} />
              <Route path="/ritual" element={<RitualPage />} />
              <Route path="/aureon" element={<AureonLandingPage />} />
              <Route path="/qgita" element={<QGITALandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
