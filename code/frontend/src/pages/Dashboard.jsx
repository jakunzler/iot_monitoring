import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import DeviceSelector from '../components/DeviceSelector';

const Dashboard = () => {
  const { t } = useTranslation();
  const [selectedDevice, setSelectedDevice] = useState('ESP32-DHT22-Publisher');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, flex: 1, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}
        >
          {t('dashboard.title')}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          gutterBottom
          sx={{ mb: { xs: 2, md: 4 }, fontSize: { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1.45 }}
        >
          {t('dashboard.subtitle')}
        </Typography>

        {/* Seletor de Dispositivo */}
        <DeviceSelector 
          selectedDevice={selectedDevice} 
          onDeviceChange={setSelectedDevice} 
        />
      </Container>
    </Box>
  );
};

export default Dashboard;