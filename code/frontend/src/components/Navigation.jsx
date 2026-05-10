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
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Language,
  Dashboard,
  Home,
  AccountTree,
  Menu as MenuIcon,
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
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  const [languageAnchor, setLanguageAnchor] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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

  const go = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: <Home />, active: isActive('/') },
    {
      path: '/dashboard',
      label: t('navigation.dashboard'),
      icon: <Dashboard />,
      active: isActive('/dashboard'),
    },
    {
      path: '/documentation',
      label: t('navigation.documentation'),
      icon: <AccountTree />,
      active: location.pathname === '/documentation',
    },
  ];

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: { xs: 1, md: 1 }, minHeight: { xs: 56, md: 64 }, px: { xs: 1.5, sm: 2 } }}>
        {isCompact && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu de navegação"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
          onClick={() => go('/')}
        >
          IoT Monitor
        </Typography>

        {!isCompact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {navItems.map(({ path, label, icon, active }) => (
              <Button
                key={path}
                color="inherit"
                startIcon={icon}
                onClick={() => navigate(path)}
                sx={{
                  backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  px: 1.5,
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0.25 }}>
          <IconButton color="inherit" onClick={handleLanguageClick} aria-label={t('common.language')}>
            <Language />
          </IconButton>
          <IconButton color="inherit" onClick={toggleTheme} aria-label={t('common.theme')}>
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

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: { width: 280, maxWidth: '85vw', boxSizing: 'border-box' },
          }}
        >
          <Box sx={{ pt: 2, pb: 1, px: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              IoT Monitor
            </Typography>
          </Box>
          <Divider />
          <List dense disablePadding>
            {navItems.map(({ path, label, icon, active }) => (
              <ListItemButton
                key={path}
                selected={active}
                onClick={() => go(path)}
                sx={{ py: 1.25 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
