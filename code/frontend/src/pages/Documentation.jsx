import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';

const UML_BASE_NAMES = [
  '01-contexto-sistema',
  '02-containers-runtime',
  '03-componentes-backend',
  '04-papeis-repositorio',
  '05-implantacao',
  '06-sequencia-dados',
];

const UML_KEYS = [
  'context',
  'containers',
  'backendComponents',
  'repositoryRoles',
  'deployment',
  'sequence',
];

const resolveUmlLocale = (language) => {
  if (language === 'pt-BR') return 'pt';
  if (language === 'es') return 'es';
  return 'en';
};

const Documentation = () => {
  const { t, language } = useTranslation();
  const umlLocale = resolveUmlLocale(language);

  return (
    <Box sx={{ py: 4, bgcolor: 'background.default', minHeight: '100%' }}>
      <Container maxWidth="lg">
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            {t('documentation.pageTitle')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('documentation.pageSubtitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
            {t('documentation.intro')}
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {UML_BASE_NAMES.map((base, index) => {
            const key = UML_KEYS[index];
            const src = `/uml/${umlLocale}/${base}.svg`;
            return (
            <Paper
              key={`${umlLocale}-${base}`}
              elevation={0}
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Typography variant="h6" component="h2" gutterBottom fontWeight={600}>
                {t(`documentation.diagrams.${key}.title`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t(`documentation.diagrams.${key}.description`)}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  overflow: 'auto',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  borderRadius: 1,
                  p: { xs: 1, sm: 2 },
                }}
              >
                <Box
                  component="img"
                  key={src}
                  src={src}
                  alt={t(`documentation.diagrams.${key}.title`)}
                  loading="lazy"
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                />
              </Box>
            </Paper>
            );
          })}
        </Stack>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 4 }}>
          {t('documentation.syncNote')}
        </Typography>
      </Container>
    </Box>
  );
};

export default Documentation;
