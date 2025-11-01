import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import InsightsTab from './pages/InsightsTab';
import LiveStreamsPage from './pages/LiveStreamsPage';
import LoginPage from './pages/LoginPage';
import MapTab from './pages/MapTab';
import MoreTab from './pages/MoreTab';
import PersonalTab from './pages/PersonalTab';
import QGITALandingPage from './pages/QGITALandingPage';
import ResourcesPage from './pages/ResourcesPage';
import RitualPage from './pages/RitualPage';
import ScrollsPage from './pages/ScrollsPage';
import SupportPage from './pages/SupportPage';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { SeroProvider } from './contexts/SeroProvider';
import { AuthProvider } from './contexts/AuthContext';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<QGITALandingPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/resources" element={<ResourcesPage />} />
    <Route path="/support" element={<SupportPage />} />

    <Route path="/console" element={<HomePage renderFullConsole />} />
    <Route path="/live" element={<LiveStreamsPage />} />
    <Route path="/map" element={<MapTab />} />
    <Route path="/me" element={<PersonalTab />} />
    <Route path="/insights" element={<InsightsTab />} />
    <Route path="/more" element={<MoreTab />} />
    <Route path="/rituals" element={<RitualPage />} />
    <Route path="/scrolls" element={<ScrollsPage />} />

    <Route path="/login" element={<LoginPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
