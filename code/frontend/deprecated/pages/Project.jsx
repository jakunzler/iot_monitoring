import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Memory,
  Sensors,
  Wifi,
  Storage,
  Code,
  Web,
  Architecture,
  Build,
  Speed,
  Security,
  ExpandMore,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';

const Project = () => {
  const { t } = useTranslation();

  const components = [
    {
      icon: <Memory />,
      title: 'PiCarX com Raspberry Pi 4',
      description: 'Placa PiCarX com Raspberry Pi CarX, processador quad-core e 1GB RAM.',
    },
    {
      icon: <Memory />,
      title: 'Módulo RM520N para 5G',
      description: 'Módulo 5G FN990A40 com RM520N, processador quad-core e 1GB RAM.',
    },
    {
      icon: <Memory />,
      title: t('project.components.esp32'),
      description: 'Microcontrolador ESP32 com Wi-Fi integrado, processador dual-core e 520KB RAM.',
    },
    {
      icon: <Sensors />,
      title: t('project.components.dht22'),
      description: 'Sensor digital de temperatura e umidade com alta precisão (±0.5°C, ±2% RH).',
    },
    {
      icon: <Wifi />,
      title: t('project.components.wifi'),
      description: 'Comunicação sem fio via Wi-Fi 802.11 b/g/n para transmissão de dados.',
    },
    {
      icon: <Storage />,
      title: t('project.components.server'),
      description: 'Servidor Flask com API REST para processamento e armazenamento de dados.',
    },
  ];

  const architecture = [
    {
      icon: <Sensors />,
      title: t('project.architecture.sensor'),
      description: 'DHT22 coleta dados de temperatura e umidade',
    },
    {
      icon: <Memory />,
      title: 'Raspberry Pi 4',
      description: 'Raspberry Pi 4 processa e formata os dados',
    },
    {
      icon: <Wifi />,
      title: 'Comunicação com módulo 5G',
      description: 'Módulo 5G transmite dados para o servidor',
    },
    {
      icon: <Storage />,
      title: t('project.architecture.server'),
      description: 'Flask recebe e processa os dados',
    },
    {
      icon: <Code />,
      title: t('project.architecture.database'),
      description: 'SQLite armazena histórico de leituras',
    },
    {
      icon: <Web />,
      title: t('project.architecture.frontend'),
      description: 'React exibe dados em tempo real',
    },
  ];

  const features = [
    {
      icon: <Speed />,
      title: t('project.features.realtime'),
      description: 'Atualizações em tempo real a cada 2.5 segundos',
    },
    {
      icon: <Storage />,
      title: t('project.features.history'),
      description: 'Histórico completo de todas as leituras',
    },
    {
      icon: <Architecture />,
      title: t('project.features.stats'),
      description: 'Estatísticas avançadas e análise de tendências',
    },
    {
      icon: <Web />,
      title: t('project.features.responsive'),
      description: 'Interface responsiva para desktop e mobile',
    },
    {
      icon: <ExpandMore />,
      title: t('project.features.multilingual'),
      description: 'Suporte a português, inglês e espanhol',
    },
    {
      icon: <Build />,
      title: t('project.features.themes'),
      description: 'Temas claro e escuro para melhor experiência',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        {t('project.title')}
      </Typography>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
        {t('project.description')}
      </Typography>

      <Grid container spacing={4}>
        {/* Componentes */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h2" gutterBottom>
                {t('project.components.title')}
              </Typography>
              
              <List>
                {components.map((component, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon sx={{ color: 'primary.main' }}>
                        {component.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={component.title}
                        secondary={component.description}
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    {index < components.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Arquitetura */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h2" gutterBottom>
                {t('project.architecture.title')}
              </Typography>
              
              <Box sx={{ position: 'relative' }}>
                {architecture.map((step, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="h6" component="h3">
                        {step.title}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ width: 32, mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {index < architecture.length - 1 && (
                      <Box
                        sx={{
                          width: 2,
                          height: 20,
                          backgroundColor: 'primary.main',
                          ml: 15,
                          mt: 1,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Funcionalidades */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h2" gutterBottom>
                {t('project.features.title')}
              </Typography>
              
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Box sx={{ color: 'primary.main', mr: 2, mt: 0.5 }}>
                        {feature.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Especificações Técnicas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Especificações Técnicas
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  PiCarX com Raspberry Pi 4
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Processador: Quad-core 1.5GHz" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="RAM: 1GB LPDDR4" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Rede: Ethernet + WiFi" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Comunicação por 5G" />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  DHT22
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Temperatura: -40°C a +80°C (±0.5°C)" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Umidade: 0-100% RH (±2%)" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Tempo de resposta: 2 segundos" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Interface: Digital (1-wire)" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Project;
