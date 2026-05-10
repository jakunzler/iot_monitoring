import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import QrCode2 from '@mui/icons-material/QrCode2';
import QRCode from 'react-qr-code';
import { getPublicSiteUrlForQr } from '../config/env';
import { useTranslation } from '../hooks/useTranslation';

/**
 * QR + link do monitoramento (URL de `getPublicSiteUrlForQr`).
 */
export default function SiteAccessQrCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
  const [snack, setSnack] = useState({ open: false, ok: true });
  const qrValue = useMemo(() => getPublicSiteUrlForQr(), []);
  const qrSize = isNarrow ? 152 : 176;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setSnack({ open: true, ok: true });
    } catch {
      setSnack({ open: true, ok: false });
    }
  };

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          width: '100%',
          maxWidth: { xs: '100%', sm: 640 },
          mx: 'auto',
          mt: 2,
          mb: 6,
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
            px: { xs: 0.5, sm: 0 },
          }}
        >
          <QrCode2 color="primary" />
          <Typography variant="h6" component="h2" textAlign="center" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {t('home.qr.title')}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 2, px: 1 }}
        >
          {t('home.qr.subtitle')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              bgcolor: '#ffffff',
              p: 1.5,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' ? 2 : 1,
              lineHeight: 0,
            }}
            aria-hidden
          >
            <QRCode value={qrValue} size={qrSize} level="M" />
          </Box>
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, maxWidth: 400, width: '100%', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Typography
                component="code"
                variant="body2"
                sx={{
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  flex: 1,
                  minWidth: 0,
                  color: 'primary.main',
                  fontFamily: 'inherit',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {qrValue}
              </Typography>
              <Tooltip title={t('home.qr.copy')}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={copy}
                  aria-label={t('home.qr.copy')}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.ok ? 'success' : 'error'}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.ok ? t('home.qr.copied') : t('home.qr.copyFailed')}
        </Alert>
      </Snackbar>
    </>
  );
}
