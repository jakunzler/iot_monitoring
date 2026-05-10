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
  // Atualiza texto relativo ("Xs atrás") a cada segundo quando houver timestamp
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (lastUpdate == null) return undefined;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [lastUpdate]);

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
    if (timestamp == null || timestamp === '') return 'Nunca';
    const n = Number(timestamp);
    if (!Number.isFinite(n)) return 'Nunca';
    // API envia segundos Unix; Date() espera ms
    const ms = n < 1e12 ? n * 1000 : n;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return 'Nunca';

    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 0) return date.toLocaleTimeString('pt-BR');
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h atrás`;
    return date.toLocaleString('pt-BR');
  };

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Tooltip title={error || getStatusText()}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant={isConnected ? 'filled' : 'outlined'}
        />
      </Tooltip>

      {lastUpdate != null && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            flexShrink: 0,
            minWidth: { xs: 0, sm: '11rem' },
            whiteSpace: { xs: 'normal', sm: 'nowrap' },
            maxWidth: { xs: '100%', sm: 'none' },
            fontFamily: 'inherit',
            lineHeight: 1.35,
          }}
        >
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
      <Box
        sx={{
          width: { xs: 'auto', sm: '7.5rem' },
          maxWidth: '100%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <Typography
          variant="caption"
          color="primary"
          sx={{
            fontFamily: 'monospace',
            width: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          Tempo real{dots}
        </Typography>
      </Box>
    </Fade>
  );
};
