import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslation } from '../hooks/useTranslation';

/**
 * User-editable Y-axis bounds for dual-axis temp/humidity charts.
 *
 * @param {object} props
 * @param {{ tempMin: number, tempMax: number, humMin: number, humMax: number }} props.ranges
 * @param {(patch: Partial<typeof props.ranges>) => void} props.onChange
 * @param {() => void} props.onReset
 */
export function ChartAxisRangeControls({ ranges, onChange, onReset }) {
  const { t } = useTranslation();

  const handleNumber = (field) => (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v)) {
      onChange({ [field]: v });
    }
  };

  return (
    <Accordion variant="outlined" disableGutters sx={{ mb: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2">{t('chartAxis.title')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={t('chartAxis.tempMin')}
              value={ranges.tempMin}
              onChange={handleNumber('tempMin')}
              inputProps={{ step: 0.5 }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={t('chartAxis.tempMax')}
              value={ranges.tempMax}
              onChange={handleNumber('tempMax')}
              inputProps={{ step: 0.5 }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={t('chartAxis.humMin')}
              value={ranges.humMin}
              onChange={handleNumber('humMin')}
              inputProps={{ step: 1 }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={t('chartAxis.humMax')}
              value={ranges.humMax}
              onChange={handleNumber('humMax')}
              inputProps={{ step: 1 }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" onClick={onReset}>
            {t('chartAxis.reset')}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default ChartAxisRangeControls;
