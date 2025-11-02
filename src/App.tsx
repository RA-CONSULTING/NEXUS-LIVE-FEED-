

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SeroProvider>
        <LiveNexusDataProvider>
          <Router>

          </Router>
        </LiveNexusDataProvider>
      </SeroProvider>
    </AuthProvider>
  );
};

export default App;
