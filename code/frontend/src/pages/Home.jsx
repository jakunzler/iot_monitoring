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
import SiteAccessQrCard from '../components/SiteAccessQrCard';

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
    <Box sx={{ minHeight: '100vh', py: { xs: 2, sm: 4 }, width: '100%', boxSizing: 'border-box' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 5, md: 8 },
            py: { xs: 3, sm: 6, md: 8 },
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.65rem', sm: '2.25rem', md: '3.75rem' },
              lineHeight: { xs: 1.2, md: 1.15 },
              px: { xs: 0.5, sm: 1 },
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
            sx={{
              mb: { xs: 2, md: 4 },
              fontWeight: 300,
              fontSize: { xs: '1rem', sm: '1.25rem', md: '2.125rem' },
              lineHeight: 1.35,
              px: { xs: 0.5, sm: 0 },
            }}
          >
            {t('home.subtitle')}
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              mb: { xs: 4, md: 6 },
              fontSize: { xs: '0.95rem', sm: '1.1rem' },
              lineHeight: 1.5,
              px: { xs: 0.5, sm: 0 },
            }}
          >
            {t('home.description')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              flexDirection: { xs: 'column', sm: 'row' },
              px: { xs: 2, sm: 0 },
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ px: { xs: 3, sm: 4 }, py: 1.5, width: { xs: '100%', sm: 'auto' } }}
            >
              {t('home.cta.primary')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard/picarx')}
              sx={{ px: { xs: 3, sm: 4 }, py: 1.5, width: { xs: '100%', sm: 'auto' } }}
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

        <SiteAccessQrCard />

        {/* Features Section */}
        <Box sx={{ mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="h3"
            component="h3"
            textAlign="center"
            gutterBottom
            sx={{ mb: { xs: 4, md: 6 }, fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}
          >
            {t('home.features.title')}
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
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
            p: { xs: 2.5, sm: 4 },
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h4"
            component="h3"
            gutterBottom
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}
          >
            {t('home.banner.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.5,
              px: { xs: 0.5, sm: 0 },
            }}
          >
            {t('home.banner.subtitle')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 360, sm: 'none' },
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
