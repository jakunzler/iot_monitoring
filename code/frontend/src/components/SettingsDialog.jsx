import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { Settings, Save, Refresh } from '@mui/icons-material';
import { getApiBaseUrl } from '../config/env';

/**
 * Componente de configurações para ajustar polling e outras opções
 */
export const SettingsDialog = ({ 
  open, 
  onClose, 
  currentInterval = 5000,
  currentBaseUrl = getApiBaseUrl(),
  onSaveSettings 
}) => {
  const [interval, setInterval] = useState(currentInterval);
  const [baseUrl, setBaseUrl] = useState(currentBaseUrl);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validar URL
    try {
      new URL(baseUrl);
    } catch {
      setError('URL inválida');
      return;
    }

    // Validar intervalo
    if (interval < 1000 || interval > 60000) {
      setError('Intervalo deve estar entre 1 e 60 segundos');
      return;
    }

    onSaveSettings({
      interval,
      baseUrl,
      autoRefresh,
      showAnimations,
    });
    onClose();
  };

  const handleReset = () => {
    setInterval(5000);
    setBaseUrl(getApiBaseUrl());
    setAutoRefresh(true);
    setShowAnimations(true);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Settings />
          Configurações do Dashboard
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
          {/* Configurações de Conexão */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Conexão
            </Typography>
            <TextField
              fullWidth
              label="URL Base da API"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              helperText="URL do servidor backend"
              margin="normal"
            />
          </Box>

          <Divider />

          {/* Configurações de Atualização */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Atualização de Dados
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Intervalo de Atualização</InputLabel>
              <Select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              >
                <MenuItem value={1000}>1 segundo</MenuItem>
                <MenuItem value={2000}>2 segundos</MenuItem>
                <MenuItem value={3000}>3 segundos</MenuItem>
                <MenuItem value={5000}>5 segundos</MenuItem>
                <MenuItem value={10000}>10 segundos</MenuItem>
                <MenuItem value={30000}>30 segundos</MenuItem>
                <MenuItem value={60000}>1 minuto</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Atualização automática"
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider />

          {/* Configurações de Interface */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Interface
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showAnimations}
                  onChange={(e) => setShowAnimations(e.target.checked)}
                />
              }
              label="Mostrar animações"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} startIcon={<Refresh />}>
          Restaurar Padrões
        </Button>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Hook para gerenciar configurações persistentes
 */
export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dashboard-settings');
    return saved ? JSON.parse(saved) : {
      interval: 5000,
      baseUrl: getApiBaseUrl(),
      autoRefresh: true,
      showAnimations: true,
    };
  });

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('dashboard-settings', JSON.stringify(updated));
  };

  return [settings, updateSettings];
};
