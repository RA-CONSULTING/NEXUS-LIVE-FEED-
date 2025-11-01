import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { SeroProvider } from './contexts/SeroProvider';
import AureonLandingPage from './pages/AureonLandingPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AureonLandingPage />} />
            </Routes>
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
