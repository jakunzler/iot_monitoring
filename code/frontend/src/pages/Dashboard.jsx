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
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
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