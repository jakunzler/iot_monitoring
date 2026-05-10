import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Thermostat,
  Opacity,
  PhoneAndroid,
  AccessTime,
  Home,
  Dashboard,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { LoadingSpinner, CardLoading, ChartLoading } from '../components/LoadingComponents';
import { ConnectionStatus, RealtimeIndicator } from '../components/ConnectionStatus';
import { ClearDatabaseButton } from '../components/ClearDatabaseButton';
import ErrorBoundary from '../components/ErrorBoundary';
import { formatUptimeSeconds } from '../utils/formatUptime';
import { resolveConnectionLabel, resolveModuleLabel } from '../utils/deviceMetadataDisplay';
import { getApiBaseUrl } from '../config/env';
import { usePersistedChartAxisRanges } from '../hooks/usePersistedChartAxisRanges';
import { ChartAxisRangeControls } from '../components/ChartAxisRangeControls';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PiCarXDashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isChartCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const DEVICE_ID = 'PiCarX-RM520N-DHT22';
  const API_BASE_URL = getApiBaseUrl();
  
  const {
    data,
    history,
    loading,
    error,
    isConnected,
    refresh,
    pausePolling,
    resumePolling,
    fetchStats
  } = useRealtimeData(DEVICE_ID, 3000, API_BASE_URL);

  const [stats, setStats] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  const { ranges: chartAxisRanges, setRanges: setChartAxisRanges, reset: resetChartAxisRanges } =
    usePersistedChartAxisRanges(`iot-chart-axes-${DEVICE_ID}`);

  // Estatísticas: atualizar sempre que houver nova leitura (mesmo ritmo do poll)
  useEffect(() => {
    if (!data) return;
    fetchStats().then(setStats).catch(console.error);
  }, [data, fetchStats]);

  // Dados do gráfico otimizados com useMemo
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    const sortedHistory = [...history].reverse();
    const labels = sortedHistory.slice(-20).map((item, index) => {
      const date = new Date(item.timestamp * 1000);
      return date.toLocaleTimeString('pt-BR');
    });

    return {
      labels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: sortedHistory.slice(-20).map(item => item.data.temperature),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Umidade (%)',
          data: sortedHistory.slice(-20).map(item => item.data.humidity),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    };
  }, [history]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: isChartCompact ? 'bottom' : 'top',
          labels: {
            boxWidth: isChartCompact ? 12 : 40,
            font: { size: isChartCompact ? 10 : 12 },
          },
        },
        title: {
          display: true,
          text: 'Histórico de Temperatura e Umidade - PiCarX',
          font: { size: isChartCompact ? 13 : 14 },
        },
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: chartAxisRanges.tempMin,
          max: chartAxisRanges.tempMax,
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: 'rgb(75, 192, 192)',
          },
          ticks: {
            color: 'rgb(75, 192, 192)',
            maxTicksLimit: 8,
          },
          grid: {
            color: 'rgba(75, 192, 192, 0.1)',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: chartAxisRanges.humMin,
          max: chartAxisRanges.humMax,
          title: {
            display: true,
            text: 'Umidade (%)',
            color: 'rgb(54, 162, 235)',
          },
          ticks: {
            color: 'rgb(54, 162, 235)',
            maxTicksLimit: 8,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Tempo',
          },
        },
      },
      animation: {
        duration: 750,
      },
      layout: {
        padding: {
          left: isChartCompact ? 4 : 8,
          right: isChartCompact ? 12 : 16,
          top: isChartCompact ? 8 : 12,
          bottom: isChartCompact ? 8 : 12,
        },
      },
    }),
    [chartAxisRanges, isChartCompact]
  );

  const handlePausePolling = () => {
    pausePolling();
    setIsPolling(false);
  };

  const handleResumePolling = () => {
    resumePolling();
    setIsPolling(true);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleClearSuccess = (result) => {
    console.log('Banco limpo:', result);
    // Recarregar dados após limpeza
    refresh();
  };

  const handleClearError = (error) => {
    console.error('Erro ao limpar banco:', error);
  };

  if (loading && !data) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        <LoadingSpinner 
          message="Carregando dados do PiCarX..." 
          fullHeight={true}
        />
      </Container>
    );
  }

  // Se não há dados e não está carregando, mostrar mensagem informativa
  if (!loading && !data && !error) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('piCarxDashboard.waitingAlertTitle')}
          </Typography>
          <Typography variant="body2">
            {t('piCarxDashboard.waitingAlertIntro')}
          </Typography>
          <ul>
            <li>{t('piCarxDashboard.waitingBullet1')}</li>
            <li>{t('piCarxDashboard.waitingBullet2')}</li>
            <li>{t('piCarxDashboard.waitingBullet3')}</li>
            <li>{t('piCarxDashboard.waitingBullet4')}</li>
          </ul>
        </Alert>
        
        <Box display="flex" justifyContent="center" gap={2}>
          <ClearDatabaseButton
            baseUrl={API_BASE_URL}
            onClearSuccess={handleClearSuccess}
            onClearError={handleClearError}
          />
        </Box>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator="›"
        sx={{
          mb: 3,
          flexWrap: 'wrap',
          '& .MuiBreadcrumbs-li': { maxWidth: '100%' },
          '& a, & p': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            wordBreak: 'break-word',
          },
        }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Home fontSize="small" />
          {t('navigation.home')}
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Dashboard fontSize="small" />
          {t('navigation.dashboard')}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneAndroid fontSize="small" />
          PiCarX Dashboard
        </Typography>
      </Breadcrumbs>

      {/* Header com status de conexão */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
        flexWrap="wrap"
        gap={{ xs: 2, sm: 1 }}
        flexDirection={{ xs: 'column', lg: 'row' }}
        sx={{ width: '100%', minWidth: 0 }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ mb: 0, fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' } }}
        >
          PiCarX Dashboard
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
          sx={{ minWidth: 0, width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'flex-start', lg: 'flex-end' } }}
        >
          <RealtimeIndicator isPolling={isPolling} interval={3000} />
          <ConnectionStatus
            isConnected={isConnected}
            error={error}
            onRefresh={handleRefresh}
            onPause={handlePausePolling}
            onResume={handleResumePolling}
            isPolling={isPolling}
            lastUpdate={data?.timestamp}
          />
          <ClearDatabaseButton
            baseUrl={API_BASE_URL}
            onClearSuccess={handleClearSuccess}
            onClearError={handleClearError}
          />
        </Box>
      </Box>

      {/* Alertas de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {error}
        </Alert>
      )}

      {/* Dados atuais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Temperatura
                  </Typography>
                  {data ? (
                    <Typography variant="h4" component="div">
                      {data.data.temperature.toFixed(1)}°C
                    </Typography>
                  ) : (
                    <CardLoading message="Carregando..." />
                  )}
                </Box>
                <Thermostat sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Umidade
                  </Typography>
                  {data ? (
                    <Typography variant="h4" component="div">
                      {data.data.humidity.toFixed(1)}%
                    </Typography>
                  ) : (
                    <CardLoading message="Carregando..." />
                  )}
                </Box>
                <Opacity sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Conexão
                    </Typography>
                    {data ? (
                      <Chip 
                        label={resolveConnectionLabel(data.metadata, DEVICE_ID)} 
                        color="success" 
                        size="small"
                        icon={<PhoneAndroid />}
                      />
                    ) : (
                      <CardLoading message="Carregando..." />
                    )}
                  </Box>
                  <PhoneAndroid sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Última Atualização
                    </Typography>
                    {data ? (
                      <Typography variant="body2">
                        {data.timestamp ? new Date(data.timestamp * 1000).toLocaleString('pt-BR') : 'Data não disponível'}
                      </Typography>
                    ) : (
                      <CardLoading message="Carregando..." />
                    )}
                  </Box>
                  <AccessTime sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          
        </Grid>
      </Grid>

      {/* Informações adicionais */}
      {data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informações do Dispositivo
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexWrap="wrap"
                    sx={{ rowGap: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                      Device ID:
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: { xs: 'left', sm: 'right' }, wordBreak: 'break-all' }}>
                      {data.device_id}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Sensor:
                    </Typography>
                    <Typography variant="body2">
                      {data.sensor_type?.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      GPIO Pin:
                    </Typography>
                    <Typography variant="body2">
                      board.D14
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    gap={2}
                    flexWrap="wrap"
                    sx={{ rowGap: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                      IP Address:
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {data.metadata?.wifi_ip || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status da Conexão
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Módulo:
                    </Typography>
                    <Typography variant="body2">
                      {resolveModuleLabel(data.metadata, DEVICE_ID)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Conexão:
                    </Typography>
                    <Typography variant="body2">
                      {resolveConnectionLabel(data.metadata, DEVICE_ID)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Uptime:
                    </Typography>
                    <Typography variant="body2">
                      {formatUptimeSeconds(data.metadata?.uptime_seconds)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Leitura #:
                    </Typography>
                    <Typography variant="body2">
                      {data.reading_number || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Gráfico */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Dados
              </Typography>
              <ChartAxisRangeControls
                ranges={chartAxisRanges}
                onChange={setChartAxisRanges}
                onReset={resetChartAxisRanges}
              />
              <Box sx={{ height: { xs: 260, sm: 340, md: 400 }, width: '100%', minWidth: 0 }}>
                {chartData ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <ChartLoading message="Carregando gráfico..." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total de Leituras
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_readings}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Temp. Média
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_temperature?.toFixed(1)}°C
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Umidade Média
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_humidity?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="h6">
                      {/* {Math.floor(stats.uptime_seconds / 3600)}h */}
                      N/A
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      </Container>
    </ErrorBoundary>
  );
};

export default PiCarXDashboard;