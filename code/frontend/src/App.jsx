import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box, GlobalStyles } from '@mui/material';
import { AppProvider } from './contexts/AppContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ESP32Dashboard from './pages/ESP32Dashboard';
import PiCarXDashboard from './pages/PiCarXDashboard';
import Documentation from './pages/Documentation';

function App() {
  return (
    <AppProvider>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { overflowX: 'hidden' },
          body: { overflowX: 'hidden' },
          '#root': { overflowX: 'hidden', maxWidth: '100vw' },
        }}
      />
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, width: '100%', minWidth: 0, overflowX: 'hidden' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/esp32" element={<ESP32Dashboard />} />
              <Route path="/dashboard/picarx" element={<PiCarXDashboard />} />
              <Route path="/documentation" element={<Documentation />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </AppProvider>
  );
}

export default App;
