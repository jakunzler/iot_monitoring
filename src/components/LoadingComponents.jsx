import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

/**
 * Componente de loading com animação suave
 */
export const LoadingSpinner = ({ 
  message = 'Carregando...', 
  size = 40, 
  showMessage = true,
  fullHeight = false 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={fullHeight ? '50vh' : 'auto'}
      p={2}
    >
      <Fade in={true} timeout={300}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress size={size} thickness={4} />
          {showMessage && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

/**
 * Componente de loading para cards específicos
 */
export const CardLoading = ({ message = 'Carregando dados...' }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="120px"
      p={2}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Componente de loading para gráficos
 */
export const ChartLoading = ({ message = 'Carregando gráfico...' }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="300px"
      p={2}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
};
