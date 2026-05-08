import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Alert,
  AlertTitle,
  Button,
} from '@mui/material';
import {
  Wifi,
  PhoneAndroid,
  Info,
  ArrowForward,
} from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const DeviceSelector = ({ selectedDevice, onDeviceChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const devices = [
    {
      id: 'ESP32-DHT22-Publisher',
      name: 'ESP32',
      description: 'Sistema com ESP32 e DHT22',
      technology: 'Wi-Fi',
      icon: <Wifi />,
      color: 'primary',
      route: '/dashboard/esp32',
      details: [
        'Microcontrolador ESP32',
        'Sensor DHT22 (Temperatura e Umidade)',
        'Comunicação Wi-Fi',
        'Servidor Flask',
        'Banco SQLite'
      ]
    },
    {
      id: 'PiCarX-5G-Publisher',
      name: 'PiCarX',
      description: 'Sistema com PiCarX e módulo 5G',
      technology: '5G',
      icon: <PhoneAndroid />,
      color: 'secondary',
      route: '/dashboard/picarx',
      details: [
        'Placa PiCarX',
        'Sensor DHT22 (Temperatura e Umidade)',
        'Módulo 5G FN990A40',
        'Comunicação 5G',
        'Servidor Flask',
        'Banco SQLite'
      ]
    }
  ];

  const handleDeviceSelect = (deviceId) => {
    onDeviceChange(deviceId);
  };

  const handleNavigateToDashboard = () => {
    const selectedDeviceData = devices.find(device => device.id === selectedDevice);
    if (selectedDeviceData) {
      navigate(selectedDeviceData.route);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Mensagem Explicativa */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>
          <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('deviceSelector.info.title')}
        </AlertTitle>
        {t('deviceSelector.info.description')}
      </Alert>

      {/* Seletor de Dispositivo */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('deviceSelector.title')}
          </Typography>
          
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t('deviceSelector.subtitle')}
            </FormLabel>
            <RadioGroup
              value={selectedDevice}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              sx={{ mt: 1 }}
            >
              {devices.map((device) => (
                <FormControlLabel
                  key={device.id}
                  value={device.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {device.icon}
                        <Typography variant="h6">
                          {device.name}
                        </Typography>
                        <Chip 
                          label={device.technology} 
                          color={device.color} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {device.description}
                        </Typography>
                        <Box component="ul" sx={{ mt: 1, pl: 2, fontSize: '0.875rem' }}>
                          {device.details.map((detail, index) => (
                            <li key={index}>
                              <Typography variant="body2" color="text.secondary">
                                {detail}
                              </Typography>
                            </li>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  }
                  sx={{ 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': {
                      width: '100%'
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
          
          {/* Botão de Navegação */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleNavigateToDashboard}
              disabled={!selectedDevice}
              sx={{ 
                minWidth: 200,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Acessar Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeviceSelector;
