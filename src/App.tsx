

import { SeroProvider } from './contexts/SeroProvider';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/live', label: 'Live', emoji: '📡', description: 'Real-time planetary data feed' },
  { path: '/map', label: 'Map', emoji: '🌍', description: 'Global sensor network & ley lines' },
  { path: '/me', label: 'Me', emoji: '💚', description: 'Personal resonance profile' },
  { path: '/insights', label: 'Insights', emoji: '⚛️', description: 'AI analysis & patterns' },
  { path: '/more', label: 'More', emoji: '☰', description: 'Settings & advanced tools' },
] as const;

const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <Layout />
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
