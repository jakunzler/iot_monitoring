import React from 'react';
import { Box, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore, BugReport } from '@mui/icons-material';

/**
 * Componente de debug para verificar dados recebidos
 */
export const DataDebugger = ({ data, history, error }) => {
  const [expanded, setExpanded] = React.useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Não mostrar em produção
  }

  return (
    <Card sx={{ mt: 2, bgcolor: 'warning.light' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BugReport color="warning" />
          <Typography variant="h6">Debug - Dados Recebidos</Typography>
        </Box>

        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="body2">
              {expanded ? 'Ocultar' : 'Mostrar'} detalhes dos dados
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Dados atuais */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Dados Atuais:
                </Typography>
                <Box component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}>
                  {JSON.stringify(data, null, 2)}
                </Box>
              </Box>

              {/* Histórico */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Histórico (últimos 3 registros):
                </Typography>
                <Box component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}>
                  {JSON.stringify(history?.slice(0, 3), null, 2)}
                </Box>
              </Box>

              {/* Erros */}
              {error && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Erro:
                  </Typography>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              )}

              {/* Estatísticas */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Estatísticas:
                </Typography>
                <Typography variant="body2">
                  • Total de registros no histórico: {history?.length || 0}
                </Typography>
                <Typography variant="body2">
                  • Timestamp atual: {data?.timestamp || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  • Timestamp é válido: {data?.timestamp > 1000000000 ? 'Sim' : 'Não'}
                </Typography>
                <Typography variant="body2">
                  • Temperatura: {data?.data?.temperature || 'N/A'}°C
                </Typography>
                <Typography variant="body2">
                  • Umidade: {data?.data?.humidity || 'N/A'}%
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};
