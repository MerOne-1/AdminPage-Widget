import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
} from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface WidgetConfig {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  slotDuration: number;
  allowedDaysInAdvance: number;
  requirePhoneNumber: boolean;
  requireEmailConfirmation: boolean;
  customCss?: string;
}

const defaultConfig: WidgetConfig = {
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  timezone: 'Europe/Paris',
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  slotDuration: 30,
  allowedDaysInAdvance: 30,
  requirePhoneNumber: true,
  requireEmailConfirmation: true,
};

export default function Settings() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'config', 'widget');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as WidgetConfig);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setSnackbar({
        open: true,
        message: 'Error loading configuration',
        severity: 'error',
      });
    }
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'config', 'widget'), config);
      setSnackbar({
        open: true,
        message: 'Configuration saved successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      setSnackbar({
        open: true,
        message: 'Error saving configuration',
        severity: 'error',
      });
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig((prev) => ({
        ...prev,
        [parent]: { ...prev[parent as keyof WidgetConfig], [child]: value },
      }));
    } else {
      setConfig((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Widget Settings</Typography>
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Business Information</Typography>
            <TextField
              fullWidth
              label="Business Name"
              value={config.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Business Email"
              value={config.businessEmail}
              onChange={(e) => handleChange('businessEmail', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Business Phone"
              value={config.businessPhone}
              onChange={(e) => handleChange('businessPhone', e.target.value)}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Working Hours</Typography>
            <TextField
              fullWidth
              label="Opening Time"
              type="time"
              value={config.workingHours.start}
              onChange={(e) => handleChange('workingHours.start', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Closing Time"
              type="time"
              value={config.workingHours.end}
              onChange={(e) => handleChange('workingHours.end', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Timezone"
              value={config.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Booking Settings</Typography>
            <TextField
              fullWidth
              label="Slot Duration (minutes)"
              type="number"
              value={config.slotDuration}
              onChange={(e) => handleChange('slotDuration', parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Allowed Days in Advance"
              type="number"
              value={config.allowedDaysInAdvance}
              onChange={(e) => handleChange('allowedDaysInAdvance', parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Form Settings</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.requirePhoneNumber}
                  onChange={(e) => handleChange('requirePhoneNumber', e.target.checked)}
                />
              }
              label="Require Phone Number"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.requireEmailConfirmation}
                  onChange={(e) => handleChange('requireEmailConfirmation', e.target.checked)}
                />
              }
              label="Require Email Confirmation"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>Custom Styling</Typography>
            <TextField
              fullWidth
              label="Custom CSS"
              multiline
              rows={4}
              value={config.customCss || ''}
              onChange={(e) => handleChange('customCss', e.target.value)}
              placeholder=".booking-widget { /* your custom CSS here */ }"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave}>
            Save Configuration
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Widget Integration</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            To integrate the booking widget into your website, add the following code:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={'<script src="https://your-widget-url.com/widget.js"></script>\n<div id="booking-widget" data-business-id="your-business-id"></div>'}
            InputProps={{
              readOnly: true,
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
