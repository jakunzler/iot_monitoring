import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  DeleteForever,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getApiBaseUrl } from '../config/env';

/**
 * Componente para limpar banco de dados com confirmação
 */
export const ClearDatabaseButton = ({ 
  baseUrl = getApiBaseUrl(),
  onClearSuccess,
  onClearError 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const handleConfirmClear = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${baseUrl}/api/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        
        if (onClearSuccess) {
          onClearSuccess(result);
        }
        
        setOpen(false);
      } else {
        throw new Error(result.error || 'Erro ao limpar banco de dados');
      }
    } catch (error) {
      console.error('Erro ao limpar banco:', error);
      
      setSnackbar({
        open: true,
        message: `Erro: ${error.message}`,
        severity: 'error'
      });
      
      if (onClearError) {
        onClearError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteForever />}
        onClick={handleClickOpen}
        disabled={loading}
        sx={{
          borderColor: 'error.main',
          flexShrink: 0,
          maxWidth: '100%',
          whiteSpace: { xs: 'normal', sm: 'nowrap' },
          textAlign: 'center',
          lineHeight: 1.25,
          '&:hover': {
            borderColor: 'error.dark',
            backgroundColor: 'error.light',
            color: 'error.contrastText'
          },
        }}
      >
        Limpar Banco de Dados
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Confirmar Limpeza do Banco
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Esta ação irá <strong>permanentemente</strong> remover todos os registros do banco de dados.
          </DialogContentText>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ ATENÇÃO:</strong> Esta operação não pode ser desfeita!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • Todos os dados históricos serão perdidos
            </Typography>
            <Typography variant="body2">
              • Os sensores continuarão enviando novos dados
            </Typography>
            <Typography variant="body2">
              • O banco será reiniciado do zero
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Digite <strong>"CONFIRMAR"</strong> para prosseguir:
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleConfirmClear}
            disabled={loading}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteForever />}
          >
            {loading ? 'Limpando...' : 'Limpar Banco'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle /> : <ErrorIcon />}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

/**
 * Hook para gerenciar estado após limpeza
 */
export const useClearDatabase = (baseUrl = getApiBaseUrl()) => {
  const [isClearing, setIsClearing] = useState(false);

  const clearDatabase = async () => {
    setIsClearing(true);
    
    try {
      const response = await fetch(`${baseUrl}/api/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar banco de dados');
      }

      return result;
    } finally {
      setIsClearing(false);
    }
  };

  return { clearDatabase, isClearing };
};
