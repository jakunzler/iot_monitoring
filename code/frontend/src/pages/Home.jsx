import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
} from '@mui/material';
import {
  Sensors,
  Wifi,
  Speed,
  ExpandMore,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Sensors sx={{ fontSize: 40 }} />,
      title: t('home.features.realtime'),
      description: t('home.featureDescriptions.realtime'),
    },
    {
      icon: <Wifi sx={{ fontSize: 40 }} />,
      title: t('home.features.wireless'),
      description: t('home.featureDescriptions.wireless'),
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: t('home.features.accurate'),
      description: t('home.featureDescriptions.accurate'),
    },
    {
      icon: <ExpandMore sx={{ fontSize: 40 }} />,
      title: t('home.features.scalable'),
      description: t('home.featureDescriptions.scalable'),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
            py: 8,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            {t('home.title')}
          </Typography>
          
          <Typography
            variant="h4"
            component="h2"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 4, fontWeight: 300 }}
          >
            {t('home.subtitle')}
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto', mb: 6, fontSize: '1.1rem' }}
          >
            {t('home.description')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4, py: 1.5 }}
            >
              {t('home.cta.primary')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard/picarx')}
              sx={{ px: 4, py: 1.5 }}
            >
              {t('home.cta.secondary')}
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => navigate('/documentation')}
            >
              {t('home.cta.documentation')}
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            component="h3"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            {t('home.features.title')}
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 0 }}>
                    <Typography variant="h6" component="h4" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats Section */}
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" component="h3" gutterBottom>
            {t('home.banner.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t('home.banner.subtitle')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            <TrendingUp sx={{ mr: 1 }} />
            {t('home.banner.cta')}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home;
