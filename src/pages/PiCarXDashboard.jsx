import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://200.137.220.50:8080';
  const DEVICE_ID = 'PiCarX-RM520N-DHT22';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados atuais
        const currentResponse = await fetch(`${API_BASE_URL}/api/latest/${DEVICE_ID}`);
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setData(currentData);
        }

        // Buscar histórico
        const historyResponse = await fetch(`${API_BASE_URL}/api/history/${DEVICE_ID}`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData);
        }

        // Buscar estatísticas
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats/${DEVICE_ID}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (err) {
        setError(t('errors.network'));
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Atualizar dados a cada 2 segundos
    const interval = setInterval(fetchData, 2000);
    
    return () => clearInterval(interval);
  }, [API_BASE_URL, DEVICE_ID, t]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const chartData = {
    labels: history.slice(-20).reverse().map((item, index) => {
      // Converter timestamp Unix para formato de tempo HH:MM:SS
      const timestamp = item.timestamp;
      const date = new Date(timestamp * 1000); // Converter para milissegundos
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: history.slice(-20).reverse().map(item => item.data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y',
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Umidade (%)',
        data: history.slice(-20).reverse().map(item => item.data.humidity),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y1',
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: 'Histórico de Temperatura e Umidade - PiCarX',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tempo',
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperatura (°C)',
          color: 'rgb(255, 99, 132)',
          font: {
            size: 14,
          },
        },
        min: 24,
        max: 36,
        grid: {
          color: 'rgba(255, 99, 132, 0.1)',
        },
        ticks: {
          color: 'rgb(255, 99, 132)',
          font: {
            size: 12,
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Umidade (%)',
          color: 'rgb(54, 162, 235)',
          font: {
            size: 14,
          },
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(54, 162, 235)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {t('common.loading')}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)', // Subtrair altura do header do navegador
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      <Container maxWidth="xl" sx={{ 
        py: 1, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 1, fontSize: '0.875rem' }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Home fontSize="small" />
            {t('navigation.home')}
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Dashboard fontSize="small" />
            {t('navigation.dashboard')}
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
            <PhoneAndroid fontSize="small" />
            PiCarX Dashboard
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <PhoneAndroid sx={{ fontSize: 28, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              PiCarX Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Monitoramento 5G com DHT22
            </Typography>
          </Box>
          <Chip label="5G" color="secondary" size="small" sx={{ ml: 'auto' }} />
        </Box>

        <Grid container spacing={1.5} sx={{ flex: 1, mb: 1 }}>
          {/* Coluna Esquerda - Leitura Atual e Estatísticas Empilhadas */}
          <Grid item xs={12} md={4}>
            {/* Leitura Atual */}
            <Card sx={{ mb: 1.5, height: '48%', boxShadow: 2 }}>
              <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {t('dashboard.current.title')}
                </Typography>
                
                {data ? (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Thermostat sx={{ mr: 1, color: 'error.main', fontSize: 20 }} />
                      <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {data.data.temperature.toFixed(2)}°C
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Opacity sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {data.data.humidity.toFixed(2)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ mr: 0.5, fontSize: 12 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {new Date(data.created_at).toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {t('common.loading')}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card sx={{ height: '50%', boxShadow: 2 }}>
              <CardContent sx={{ p: 1.5, height: '100%', overflow: 'auto' }}>
                <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {t('dashboard.stats.title')}
                </Typography>
                
                {stats ? (
                  <Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.avg_temperature?.toFixed(2)}°C
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.avgTemperature')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.avg_humidity?.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.avgHumidity')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.max_temperature?.toFixed(2)}°C
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.maxTemperature')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.max_humidity?.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.maxHumidity')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.min_temperature?.toFixed(2)}°C
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.minTemperature')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.min_humidity?.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.minHumidity')}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {stats.total_readings}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('dashboard.stats.totalReadings')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {t('common.loading')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna Direita - Gráfico */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', width: '100%', boxShadow: 2 }}>
              <CardContent sx={{ height: '100%', p: 1.5, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" component="h2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {t('dashboard.history.title')}
                </Typography>
                <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Rodapé - Informações do Dispositivo */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Container maxWidth="xl" sx={{ py: 0.5 }}>
          <Typography variant="body2" component="h3" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            {t('dashboard.device.title')}
          </Typography>
          
          {data ? (
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {t('dashboard.device.id')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.device_id}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {t('dashboard.device.status')}
                  </Typography>
                  <Chip 
                    label={data.metadata?.status || 'online'} 
                    color={getStatusColor(data.metadata?.status || 'online')}
                    size="small"
                    sx={{ fontSize: '0.75rem', height: 20 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Módulo 5G
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {'RM520N-GL'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Conexão
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.metadata?.connection_type || '5G'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    GPIO Pin
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.metadata?.gpio_pin || '11'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Sinal 5G
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {data.metadata?.wifi_rssi ? `${data.metadata.wifi_rssi} dBm` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary" variant="body2">
              {t('common.loading')}
            </Typography>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default PiCarXDashboard;
