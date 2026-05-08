import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Language,
  Dashboard,
  Home,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../hooks/useTranslation';

const Navigation = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: appTheme, toggleTheme, language, changeLanguage } = useAppContext();
  const { t } = useTranslation();

  const [languageAnchor, setLanguageAnchor] = React.useState(null);

  const handleLanguageClick = (event) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchor(null);
  };

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    handleLanguageClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          IoT Monitor
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('navigation.home')}
          </Button>

          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/dashboard')}
            sx={{
              backgroundColor: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('navigation.dashboard')}
          </Button>

          <IconButton
            color="inherit"
            onClick={handleLanguageClick}
            sx={{ ml: 1 }}
          >
            <Language />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ ml: 1 }}
          >
            {appTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>

        <Menu
          anchorEl={languageAnchor}
          open={Boolean(languageAnchor)}
          onClose={handleLanguageClose}
        >
          <MenuItem
            onClick={() => handleLanguageChange('pt-BR')}
            selected={language === 'pt-BR'}
          >
            Português
          </MenuItem>
          <MenuItem
            onClick={() => handleLanguageChange('en')}
            selected={language === 'en'}
          >
            English
          </MenuItem>
          <MenuItem
            onClick={() => handleLanguageChange('es')}
            selected={language === 'es'}
          >
            Español
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
