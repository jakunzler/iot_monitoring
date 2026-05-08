import React from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Tooltip,
  IconButton,
  Fade
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Refresh,
  Pause,
  PlayArrow,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Componente de status de conexão
 */
export const ConnectionStatus = ({ 
  isConnected, 
  error, 
  onRefresh, 
  onPause, 
  onResume,
  isPolling = true,
  lastUpdate = null 
}) => {
  const getStatusColor = () => {
    if (error) return 'error';
    if (isConnected) return 'success';
    return 'warning';
  };

  const getStatusIcon = () => {
    if (error) return <ErrorIcon />;
    if (isConnected) return <Wifi />;
    return <WifiOff />;
  };

  const getStatusText = () => {
    if (error) return 'Erro de conexão';
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      <Tooltip title={error || getStatusText()}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant={isConnected ? 'filled' : 'outlined'}
        />
      </Tooltip>

      {lastUpdate && (
        <Typography variant="caption" color="text.secondary">
          Última atualização: {formatLastUpdate(lastUpdate)}
        </Typography>
      )}

      <Box display="flex" alignItems="center" gap={0.5}>
        <Tooltip title="Atualizar dados">
          <IconButton 
            size="small" 
            onClick={onRefresh}
            disabled={!isConnected}
          >
            <Refresh />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPolling ? 'Pausar atualização' : 'Retomar atualização'}>
          <IconButton 
            size="small" 
            onClick={isPolling ? onPause : onResume}
          >
            {isPolling ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

/**
 * Componente de indicador de dados em tempo real
 */
export const RealtimeIndicator = ({ isPolling, interval = 5000 }) => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, interval / 3);

    return () => clearInterval(intervalId);
  }, [isPolling, interval]);

  if (!isPolling) return null;

  return (
    <Fade in={true} timeout={500}>
      <Typography 
        variant="caption" 
        color="primary" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontFamily: 'monospace'
        }}
      >
        Tempo real{dots}
      </Typography>
    </Fade>
  );
};
