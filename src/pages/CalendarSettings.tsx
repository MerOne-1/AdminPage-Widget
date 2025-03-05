import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Employee {
  id: string;
  name: string;
  email?: string;
  role: string;
  active: boolean;
}

interface CalendarCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

interface CalendarSettings {
  credentials?: CalendarCredentials;
  tokens?: Record<string, any>;
}

export default function CalendarSettings() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({});
  const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<CalendarCredentials>({
    client_id: '',
    client_secret: '',
    redirect_uris: ['https://europe-west1-widget-v2-2dee9.cloudfunctions.net/googleAuthCallback']
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employeesData = employeesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);

        // Fetch calendar settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'googleCalendar'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as CalendarSettings);
          if (settingsDoc.data().credentials) {
            setCredentials(settingsDoc.data().credentials as CalendarCredentials);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveCredentials = async () => {
    try {
      await setDoc(doc(db, 'settings', 'googleCalendar'), {
        ...settings,
        credentials: credentials,
        updatedAt: new Date()
      }, { merge: true });

      setSettings({
        ...settings,
        credentials: credentials
      });

      setOpenCredentialsDialog(false);
      setSnackbar({
        open: true,
        message: 'Credentials saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save credentials',
        severity: 'error'
      });
    }
  };

  const generateAuthUrl = (employeeEmail: string) => {
    if (!settings.credentials) {
      setSnackbar({
        open: true,
        message: 'Google Calendar credentials not configured',
        severity: 'error'
      });
      return;
    }

    // This is a simplified example - in a real application, you would handle this server-side
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(settings.credentials.client_id)}` +
      `&redirect_uri=${encodeURIComponent(settings.credentials.redirect_uris[0])}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(employeeEmail)}`;

    window.open(authUrl, '_blank');
  };
  
  const copyAuthLinkToClipboard = (employeeEmail: string) => {
    if (!settings.credentials) {
      setSnackbar({
        open: true,
        message: 'Google Calendar credentials not configured',
        severity: 'error'
      });
      return;
    }
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(settings.credentials.client_id)}` +
      `&redirect_uri=${encodeURIComponent(settings.credentials.redirect_uris[0])}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(employeeEmail)}`;
    
    navigator.clipboard.writeText(authUrl);
    
    setSnackbar({
      open: true,
      message: `Authorization link for ${employeeEmail} copied to clipboard. You can now paste it into an email.`,
      severity: 'success'
    });
  };
  
  const sendAuthLinkByEmail = (employeeEmail: string, employeeName: string) => {
    if (!settings.credentials) {
      setSnackbar({
        open: true,
        message: 'Google Calendar credentials not configured',
        severity: 'error'
      });
      return;
    }
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(settings.credentials.client_id)}` +
      `&redirect_uri=${encodeURIComponent(settings.credentials.redirect_uris[0])}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(employeeEmail)}`;
    
    const subject = encodeURIComponent('Connect your Google Calendar');
    const body = encodeURIComponent(
      `Hello ${employeeName},\n\n` +
      `Please click the link below to connect your Google Calendar with our booking system. ` +
      `This will allow your appointments to automatically appear in your calendar.\n\n` +
      `${authUrl}\n\n` +
      `Thank you!`
    );
    
    window.open(`mailto:${employeeEmail}?subject=${subject}&body=${body}`);
    
    setSnackbar({
      open: true,
      message: `Email drafted for ${employeeEmail}`,
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Google Calendar Integration
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How Google Calendar Integration Works
          </Typography>
          <Typography variant="body1" paragraph>
            This integration automatically adds booking events to your staff's Google Calendars when new bookings are created.
          </Typography>
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Setup Steps (Admin Only):
          </Typography>
          <ol>
            <li><Typography>Add Google Calendar API credentials (one-time setup)</Typography></li>
            <li><Typography>For each staff member, authorize their Google Calendar by logging in with their Google account</Typography></li>
            <li><Typography>That's it! New bookings will automatically appear in the connected Google Calendars</Typography></li>
          </ol>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Google Calendar API Credentials
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setOpenCredentialsDialog(true)}
                >
                  {settings.credentials ? 'Update Credentials' : 'Add Credentials'}
                </Button>
              </Box>
              
              {settings.credentials ? (
                <Box>
                  <Typography variant="body1">
                    Client ID: {settings.credentials.client_id.substring(0, 10)}...
                  </Typography>
                  <Typography variant="body1">
                    Redirect URI: {settings.credentials.redirect_uris[0]}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="warning">
                  Google Calendar API credentials not configured. Please add your credentials to enable calendar integration.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Staff Calendar Authorization
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Staff Calendar Authorization
                </Typography>
                <Typography paragraph>
                  You have three options to authorize staff members' Google Calendars:
                </Typography>
                
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Option 1: Direct Authorization ("Authorize" button)
                </Typography>
                <Typography paragraph>
                  Use this if you have access to the staff member's Google account:
                </Typography>
                <ol>
                  <li>Click "Authorize" next to the staff member</li>
                  <li>Log in with their Google account</li>
                  <li>Click "Allow" to give permission</li>
                </ol>
                
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Option 2: Send Authorization Link by Email ("Email Link" button)
                </Typography>
                <Typography paragraph>
                  Best option when staff members need to authorize themselves:
                </Typography>
                <ol>
                  <li>Click "Email Link" next to the staff member</li>
                  <li>An email draft will open with the authorization link</li>
                  <li>Send the email to the staff member</li>
                  <li>They click the link and authorize access to their calendar</li>
                </ol>
                
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Option 3: Copy Authorization Link ("Copy Link" button)
                </Typography>
                <Typography paragraph>
                  Use this to share the link via other communication channels:
                </Typography>
                <ol>
                  <li>Click "Copy Link" next to the staff member</li>
                  <li>The authorization link is copied to your clipboard</li>
                  <li>Paste it into any messaging app or custom email</li>
                </ol>
              </Alert>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.filter(emp => emp.email).map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          {settings.tokens && settings.tokens[employee.email!] ? (
                            <Typography color="success.main">Authorized</Typography>
                          ) : (
                            <Typography color="error.main">Not Authorized</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={!settings.credentials}
                              onClick={() => generateAuthUrl(employee.email!)}
                            >
                              {settings.tokens && settings.tokens[employee.email!] ? 'Reauthorize' : 'Authorize'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              disabled={!settings.credentials}
                              onClick={() => copyAuthLinkToClipboard(employee.email!)}
                            >
                              Copy Link
                            </Button>
                            <Button
                              variant="outlined"
                              color="info"
                              disabled={!settings.credentials}
                              onClick={() => sendAuthLinkByEmail(employee.email!, employee.name)}
                            >
                              Email Link
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {employees.filter(emp => emp.email).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body1">
                            No staff members with email addresses found. Please add email addresses to your staff members.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Credentials Dialog */}
      <Dialog 
        open={openCredentialsDialog} 
        onClose={() => setOpenCredentialsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Google Calendar API Credentials</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                How to set up Google Calendar integration:
              </Typography>
              <ol>
                <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                <li>Create a project or select an existing one</li>
                <li>Enable the Google Calendar API</li>
                <li>Create OAuth 2.0 credentials (Web application type)</li>
                <li>Add the redirect URI shown below to your OAuth credentials</li>
                <li>Copy the Client ID and Client Secret and paste them here</li>
              </ol>
            </Alert>
            
            <TextField
              label="Client ID"
              value={credentials.client_id}
              onChange={(e) => setCredentials({ ...credentials, client_id: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Client Secret"
              value={credentials.client_secret}
              onChange={(e) => setCredentials({ ...credentials, client_secret: e.target.value })}
              fullWidth
              required
              type="password"
            />
            
            <TextField
              label="Redirect URI (Copy this to Google Cloud Console)"
              value={credentials.redirect_uris[0]}
              fullWidth
              required
              InputProps={{
                readOnly: true,
              }}
              helperText="This is the callback URL for Google OAuth. Add this exact URL to your authorized redirect URIs in Google Cloud Console."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCredentialsDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveCredentials} 
            variant="contained" 
            color="primary"
            disabled={!credentials.client_id || !credentials.client_secret || !credentials.redirect_uris[0]}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
