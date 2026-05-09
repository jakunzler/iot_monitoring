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
} from '@mui/material';
import {
  Thermostat,
  Opacity,
  Wifi,
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

const ESP32Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const DEVICE_ID = 'ESP32-DHT22-Publisher';
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

  // Estatísticas: atualizar a cada nova leitura (alinhado ao poll do histórico)
  useEffect(() => {
    if (!data) return;
    fetchStats().then(setStats).catch(console.error);
  }, [data, fetchStats]);

  // Função para corrigir timestamp do ESP32
  const fixESP32Timestamp = (timestamp) => {
    if (timestamp < 1000000000) {
      // Se o timestamp é muito pequeno, é provavelmente millis() em segundos
      // Vamos estimar um timestamp Unix baseado no tempo atual
      const now = Math.floor(Date.now() / 1000);
      const maxTimestamp = history.length > 0 ? Math.max(...history.map(h => h.timestamp)) : timestamp;
      const estimatedTimestamp = now - (maxTimestamp - timestamp);
      return estimatedTimestamp;
    }
    return timestamp;
  };

  // Dados do gráfico otimizados com useMemo
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Ordenar por timestamp (mais recente primeiro)
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    
    // Pegar os últimos 20 registros
    const recentData = sortedHistory.slice(0, 20).reverse();
    
    // Criar labels baseados no índice (já que os timestamps são problemáticos)
    const labels = recentData.map((item, index) => {
      // Para timestamps pequenos, usar índice relativo
      if (item.timestamp < 1000000000) {
        return `-${recentData.length - index - 1}m`;
      }
      const timestamp = fixESP32Timestamp(item.timestamp);
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('pt-BR');
    });

    return {
      labels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: recentData.map(item => item.data.temperature),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Umidade (%)',
          data: recentData.map(item => item.data.humidity),
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
          position: 'top',
        },
        title: {
          display: true,
          text: 'Histórico de Temperatura e Umidade',
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
    }),
    [chartAxisRanges]
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LoadingSpinner 
          message="Carregando dados do ESP32..." 
          fullHeight={true}
        />
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
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
          <Wifi fontSize="small" />
          ESP32 Dashboard
        </Typography>
      </Breadcrumbs>

      {/* Header com status de conexão */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          ESP32 Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dados atuais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} size={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
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

        <Grid item xs={12} sm={6} size={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
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

        <Grid item xs={12} sm={6} size={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  {data ? (
                    <Chip 
                      label="Online" 
                      color="success" 
                      size="small"
                      icon={<Wifi />}
                    />
                  ) : (
                    <CardLoading message="Carregando..." />
                  )}
                </Box>
                <Wifi sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} size={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Última Atualização
                  </Typography>
                  {data ? (
                    <Typography variant="body2">
                      {data.timestamp ? new Date(fixESP32Timestamp(data.timestamp) * 1000).toLocaleString('pt-BR') : 'Data não disponível'}
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
              <Box sx={{ height: 400 }}>
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
                  <Grid item xs={6} size={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total de Leituras
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_readings}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} size={3}>
                    <Typography variant="body2" color="text.secondary">
                      Temp. Média
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_temperature?.toFixed(1)}°C
                    </Typography>
                  </Grid>
                  <Grid item xs={6} size={3}>
                    <Typography variant="body2" color="text.secondary">
                      Umidade Média
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_humidity?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} size={3}>
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

export default ESP32Dashboard;