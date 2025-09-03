import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Thermostat,
  Opacity,
  Wifi,
  AccessTime,
  TrendingUp,
  TrendingDown,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8080'; // Será configurado para GCP
  const DEVICE_ID = 'ESP32-DHT22-Publisher';

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
    
    // Atualizar dados a cada 2 segundos para garantir dados mais atualizados
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
        return 'warning';
    }
  };

  const getSignalStrength = (rssi) => {
    if (rssi >= -50) return 'Excelente';
    if (rssi >= -60) return 'Bom';
    if (rssi >= -70) return 'Regular';
    return 'Fraco';
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const chartData = {
    labels: history.slice(-20).reverse().map((item, index) => {
      // Usar índice como label para o gráfico, já que timestamp é uptime do ESP32
      // Inverter para que as amostras mais recentes apareçam à direita
      return `${index + 1}`;
    }),
    datasets: [
      {
        label: t('dashboard.current.temperature'),
        data: history.slice(-20).reverse().map(item => item.data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: t('dashboard.current.humidity'),
        data: history.slice(-20).reverse().map(item => item.data.humidity),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Remover animação para evitar problemas durante atualizações
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: t('dashboard.history.title'),
        font: {
          size: 18,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 24, // Temperatura mínima fixa
        max: 36, // Temperatura máxima fixa
        title: {
          display: true,
          text: 'Temperatura (°C)',
          color: 'rgb(255, 99, 132)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 99, 132, 0.1)'
        },
        ticks: {
          color: 'rgb(255, 99, 132)',
          font: {
            size: 12
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0, // Umidade mínima fixa
        max: 100, // Umidade máxima fixa
        title: {
          display: true,
          text: 'Umidade (%)',
          color: 'rgb(53, 162, 235)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(53, 162, 235, 0.1)'
        },
        ticks: {
          color: 'rgb(53, 162, 235)',
          font: {
            size: 12
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Amostras',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 3
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          {t('dashboard.subtitle')}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Coluna Esquerda - Leitura Atual e Estatísticas Empilhadas */}
          <Grid item xs={12} md={4}>
            {/* Leitura Atual */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('dashboard.current.title')}
                </Typography>
                
                {data ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Thermostat sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="h4" component="span">
                        {data.data.temperature}°C
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Opacity sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h4" component="span">
                        {data.data.humidity}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date().toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    {t('errors.data')}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('dashboard.stats.title')}
                </Typography>
                
                {stats ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="error.main">
                        {stats.avg_temperature?.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.stats.avgTemperature')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="primary.main">
                        {stats.avg_humidity?.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.stats.avgHumidity')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="error.main">
                        {stats.max_temperature?.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.stats.maxTemperature')}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="h6" color="error.main">
                        {stats.min_temperature?.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.stats.minTemperature')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    {t('errors.stats')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna Direita - Gráfico */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '600px', width: '100%' }}>
              <CardContent sx={{ height: '100%', p: 2 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {t('dashboard.history.title')}
                </Typography>
                <Box sx={{ height: '500px', width: '100%' }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Rodapé - Informações do Dispositivo */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {t('dashboard.device.title')}
          </Typography>
          
          {data ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.device.id')}
                  </Typography>
                  <Typography variant="body1">
                    {data.device_id}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.device.status')}
                  </Typography>
                  <Chip 
                    label="Online" 
                    color="success" 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.device.ip')}
                  </Typography>
                  <Typography variant="body1">
                    {data.metadata?.wifi_ip || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.device.signal')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Wifi sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      {data.metadata?.wifi_rssi ? 
                        `${data.metadata.wifi_rssi} dBm (${getSignalStrength(data.metadata.wifi_rssi)})` : 
                        'N/A'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">
              {t('errors.device')}
            </Typography>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
