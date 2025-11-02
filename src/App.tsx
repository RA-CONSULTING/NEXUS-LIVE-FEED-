import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { LiveNexusDataProvider } from './contexts/LiveNexusDataContext';
import { SeroProvider } from './contexts/SeroProvider';
import TermsOfUsePage from './pages/TermsOfUsePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-8">
              <div className="mx-auto max-w-5xl">
                <Routes>
                  <Route path="/terms" element={<TermsOfUsePage />} />
                  <Route path="*" element={<Navigate to="/terms" replace />} />
                </Routes>
              </div>
            </main>
          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
