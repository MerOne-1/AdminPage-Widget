import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Avatar,
  Stack,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SwapHoriz as SwapHorizIcon,
  PersonAdd as PersonAddIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Professional {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  bookings?: Record<string, Record<string, Booking>>;
  avatar?: string;
  color?: string;
}

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  timeSlot: string | { start: string; end: string };
  service: string;
  serviceName?: string;
  professionalId: string;
  professionalName?: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  notes?: string;
  clientComments?: string;
  clientInfo?: any; // For direct access to the clientInfo object
  createdAt?: string;
  updatedAt?: string;
}

function getBookingTime(booking: Booking): string {
  // Handle timeSlot object from Firebase structure
  if (booking.timeSlot && typeof booking.timeSlot === 'object') {
    if (booking.timeSlot.start && booking.timeSlot.end) {
      return `${booking.timeSlot.start} - ${booking.timeSlot.end}`;
    }
  } else if (typeof booking.timeSlot === 'string') {
    return booking.timeSlot;
  } else if (booking.time) {
    return booking.time;
  }
  return 'N/A';
}

function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'canceled': return 'error';
    case 'completed': return 'primary';
    default: return 'default';
  }
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`professional-tabpanel-${index}`}
      aria-labelledby={`professional-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Bookings() {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [services, setServices] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [statusBookingId, setStatusBookingId] = useState<string | null>(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleBookingClick = (booking: Booking) => {
    console.log('Booking data:', booking);
    console.log('Client info:', booking.clientInfo);
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedBooking(null);
    setOpenDialog(false);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, bookingId: string) => {
    setStatusAnchorEl(event.currentTarget);
    setStatusBookingId(bookingId);
  };

  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
  };

  const handleStatusChange = async (newStatus: 'pending' | 'confirmed' | 'canceled' | 'completed') => {
    // Get the booking ID either from the selected booking in the dialog or from the status menu
    const bookingId = statusBookingId || (selectedBooking ? selectedBooking.id : null);
    if (!bookingId) return;
    
    // Show loading snackbar
    setSnackbar({
      open: true,
      message: t('bookings.status.updating'),
      severity: 'info'
    });
    
    try {
      // Update the status in Firestore
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      
      // Update local state if we're in the dialog
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      
      // Success message
      setSnackbar({
        open: true,
        message: t('bookings.status.updateSuccess', { status: t(`bookings.status.${newStatus}`) }),
        severity: 'success'
      });
      
      // Refresh data to ensure UI is up to date - after showing success message
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      // Error message
      setSnackbar({
        open: true,
        message: t('bookings.status.updateError') + ': ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
    
    handleStatusMenuClose();
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await deleteDoc(bookingRef);
      
      // Update local state - remove the booking from the professionals array
      const updatedProfessionals = [...professionals];
      const profIndex = updatedProfessionals.findIndex(p => p.id === selectedBooking.professionalId);
      
      if (profIndex !== -1) {
        const professional = updatedProfessionals[profIndex];
        const updatedBookings = (professional.bookings || []).filter(b => b.id !== selectedBooking.id);
        updatedProfessionals[profIndex] = { ...professional, bookings: updatedBookings };
        setProfessionals(updatedProfessionals);
      }
      
      setSnackbar({
        open: true,
        message: t('bookings.deleteSuccess'),
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setSnackbar({
        open: true,
        message: t('bookings.deleteError'),
        severity: 'error'
      });
    }
    
    setConfirmDeleteDialog(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Define fetchData function that can be called from other functions
  const fetchData = async () => {
      try {
        // Fetch services first for reference
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData: Record<string, any> = {};
        servicesSnapshot.forEach((doc) => {
          servicesData[doc.id] = doc.data();
        });
        setServices(servicesData);

        // Fetch employees from the employees collection
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        console.log(`Found ${employeesSnapshot.docs.length} employees in the database`);
        
        const employeesData: Professional[] = [];
        
        // Process each employee
        for (const docSnapshot of employeesSnapshot.docs) {
          try {
            const data = docSnapshot.data() as Professional;
            data.id = docSnapshot.id;
            data.bookings = {}; // Initialize empty bookings object
            
            employeesData.push(data);
          } catch (err) {
            console.error(`Error processing employee ${docSnapshot.id}:`, err);
          }
        }
        
        // Now fetch all bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        console.log(`Found ${bookingsSnapshot.docs.length} bookings in the database`);
        
        // Fetch clients for reference
        const clientsSnapshot = await getDocs(collection(db, 'clients'));
        const clientsData: Record<string, any> = {};
        clientsSnapshot.forEach((doc) => {
          clientsData[doc.id] = doc.data();
        });
        console.log(`Found ${Object.keys(clientsData).length} clients in the database`);
        
        // Process each booking and associate with the correct employee
        for (const bookingDoc of bookingsSnapshot.docs) {
          try {
            const bookingData = bookingDoc.data();
            const employeeId = bookingData.employeeId;
            
            if (employeeId) {
              // Find the employee this booking belongs to
              const employee = employeesData.find(emp => emp.id === employeeId);
              
              if (employee) {
                // Create date entry if it doesn't exist
                const bookingDate = bookingData.date;
                if (!employee.bookings[bookingDate]) {
                  employee.bookings[bookingDate] = {};
                }
                
                // Get client name from clientInfo object based on Firebase structure
                let clientName = 'Unknown Client';
                if (bookingData.clientInfo) {
                  const { firstName, lastName } = bookingData.clientInfo;
                  if (firstName || lastName) {
                    clientName = `${firstName || ''} ${lastName || ''}`.trim();
                  }
                } else if (bookingData.clientName) {
                  clientName = bookingData.clientName;
                } else if (bookingData.client && typeof bookingData.client === 'object') {
                  clientName = bookingData.client.name || bookingData.client.firstName || clientName;
                } else if (bookingData.clientId && clientsData[bookingData.clientId]) {
                  const clientData = clientsData[bookingData.clientId];
                  clientName = clientData.name || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || clientName;
                }
                
                // Get service name from the booking data
                let serviceName = 'Unknown Service';
                
                // Handle new structure with services array
                if (bookingData.services && Array.isArray(bookingData.services) && bookingData.services.length > 0) {
                  // Get names of all services
                  const serviceNames = bookingData.services.map(service => service.name).filter(Boolean);
                  
                  if (serviceNames.length > 0) {
                    // Join multiple service names with commas
                    serviceName = serviceNames.join(', ');
                  }
                }
                // Handle old structure with serviceId
                else if (bookingData.serviceId) {
                  const serviceDoc = servicesData[bookingData.serviceId];
                  if (serviceDoc && serviceDoc.name) {
                    serviceName = serviceDoc.name;
                  }
                }
                
                // Extract client info and comments if available
                let clientComments = '';
                let clientInfo = null;
                
                if (bookingData.clientInfo) {
                  // Preserve the entire clientInfo object
                  clientInfo = bookingData.clientInfo;
                  
                  // Extract comments if available
                  if (bookingData.clientInfo.comments) {
                    clientComments = bookingData.clientInfo.comments;
                  }
                }
                
                // Add booking to employee's bookings
                const timeSlot = bookingData.timeSlot || bookingData.time;
                employee.bookings[bookingDate][timeSlot] = {
                  ...bookingData,
                  id: bookingDoc.id,
                  clientName: clientName,
                  serviceName: serviceName,
                  clientComments: clientComments,
                  clientInfo: clientInfo // Preserve the entire clientInfo object
                };
              }
            }
          } catch (err) {
            console.error(`Error processing booking ${bookingDoc.id}:`, err);
          }
        }
        
        // Count bookings for each employee
        employeesData.forEach(employee => {
          const bookingDates = Object.keys(employee.bookings);
          console.log(`Employee ${employee.name} has ${bookingDates.length} booking dates`);
        });
        
        setProfessionals(employeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, []);

  // Function to get all bookings for a professional
  const getAllBookings = (professional: Professional): Booking[] => {
    if (!professional.bookings) return [];
    
    const allBookings: Booking[] = [];
    
    // Iterate through each date
    Object.entries(professional.bookings).forEach(([date, bookingsForDate]) => {
      // Handle both object and array formats
      if (Array.isArray(bookingsForDate)) {
        bookingsForDate.forEach((booking, index) => {
          allBookings.push({
            ...booking,
            id: booking.id || `booking-${index}`,
            date
          });
        });
      } else {
        // Object format
        Object.entries(bookingsForDate).forEach(([bookingId, booking]) => {
          allBookings.push({
            ...booking,
            id: booking.id || bookingId,
            date
          });
        });
      }
    });
    
    // Sort by date and time
    return allBookings.sort((a, b) => {
      // First compare dates
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, compare times
      const aTime = typeof a.timeSlot === 'string' 
        ? a.timeSlot.split('-')[0].trim() 
        : a.timeSlot?.start || '';
        
      const bTime = typeof b.timeSlot === 'string' 
        ? b.timeSlot.split('-')[0].trim() 
        : b.timeSlot?.start || '';
        
      return aTime.localeCompare(bTime);
    });
  };

  // Function to get service name from ID or use pre-fetched name
  const getServiceName = (booking: any): string => {
    if (booking && booking.serviceName) {
      return booking.serviceName;
    }
    if (!booking) return 'Unknown Service';
    
    const serviceId = booking.serviceId || booking.service;
    return serviceId && services[serviceId]?.name || 'Unknown Service';
  };

  // Function to get client comments
  const getClientComments = (booking: any): string => {
    if (!booking) return '-';
    
    // Check for comments in different possible locations
    if (booking.clientComments) {
      return booking.clientComments;
    }
    
    if (booking.clientInfo && booking.clientInfo.comments) {
      return booking.clientInfo.comments;
    }
    
    // For direct Firebase data structure
    if (booking.clientInfo && typeof booking.clientInfo === 'object' && 'comments' in booking.clientInfo) {
      return booking.clientInfo.comments;
    }
    
    return '-';
  };

  // Function to format date for display
  const formatDate = (dateStr: string): string => {
    try {
      // Handle different date formats
      let date;
      if (dateStr.includes('de')) {
        // Spanish format: "lunes, 27 de marzo de 2025"
        const parts = dateStr.split(' de ');
        if (parts.length >= 3) {
          const day = parts[0].split(', ')[1] || parts[0];
          const month = parts[1];
          const year = parts[2].replace(' de ', '');
          
          const monthMap: Record<string, number> = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
            'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
          };
          
          date = new Date(parseInt(year), monthMap[month], parseInt(day));
        } else {
          date = new Date(dateStr);
        }
      } else {
        // ISO or other format
        date = new Date(dateStr);
      }
      
      return format(date, 'PPP'); // Long date format
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Add a console log to debug professionals data
  console.log('Professionals loaded:', professionals);
  
  // If no employees, show a message
  if (professionals.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Professional Bookings
        </Typography>
        <Typography color="text.secondary">
          No employees found in the database. Please add employees with bookings first.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Professional Bookings ({professionals.length})
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {professionals.map((professional, index) => (
            <Tab 
              key={professional.id} 
              label={professional.name} 
              id={`professional-tab-${index}`}
              aria-controls={`professional-tabpanel-${index}`}
            />
          ))}
        </Tabs>
        
        {professionals.map((professional, index) => {
          const bookings = getAllBookings(professional);
          
          return (
            <TabPanel key={professional.id} value={value} index={index}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {professional.name}'s Bookings ({bookings.length})
                </Typography>
              </Box>
              
              {bookings.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No bookings found for this professional.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="bookings table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Comments</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow 
                          key={booking.id}
                          sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' } }}
                        >
                          <TableCell>{formatDate(booking.date)}</TableCell>
                          <TableCell>{getBookingTime(booking)}</TableCell>
                          <TableCell>{booking?.clientName || 'Unknown Client'}</TableCell>
                          <TableCell>{booking ? getServiceName(booking) : 'Unknown Service'}</TableCell>
                          <TableCell>
                            {getClientComments(booking)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status} 
                              color={getStatusColor(booking.status)}
                              size="small"
                              onClick={(e) => handleStatusMenuOpen(e, booking.id)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleBookingClick(booking)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          );
        })}
      </Paper>
      
      {/* Booking Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('bookings.bookingDetails')}</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Appointment Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body1">{formatDate(selectedBooking.date)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Time</Typography>
                        <Typography variant="body1">{getBookingTime(selectedBooking)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Service</Typography>
                        <Typography variant="body1">{getServiceName(selectedBooking.service)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedBooking.status} 
                          color={getStatusColor(selectedBooking.status)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Client Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{selectedBooking.clientName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedBooking.clientEmail || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1">{selectedBooking.clientPhone || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {selectedBooking.notes && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body1">{selectedBooking.notes}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Client Comments
                    </Typography>
                    <Typography variant="body1">
                      {getClientComments(selectedBooking) !== '-' 
                        ? getClientComments(selectedBooking) 
                        : 'No comments provided'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Button 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDeleteDialog(true)}
            >
              Delete
            </Button>
          </Box>
          <Box>
            <Button 
              color="primary" 
              startIcon={<SwapHorizIcon />}
              onClick={(e) => handleStatusMenuOpen(e, selectedBooking ? selectedBooking.id : '')}
              sx={{ mr: 1 }}
            >
              Change Status
            </Button>
            <Button onClick={handleCloseDialog}>Close</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onClose={() => setConfirmDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this booking? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteBooking}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Status Menu - Shared between table and dialog */}
      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('pending')}>
          <Chip label="Pending" color="warning" size="small" sx={{ mr: 1 }} /> Pending
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('confirmed')}>
          <Chip label="Confirmed" color="success" size="small" sx={{ mr: 1 }} /> Confirmed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>
          <Chip label="Completed" color="primary" size="small" sx={{ mr: 1 }} /> Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('canceled')}>
          <Chip label="Canceled" color="error" size="small" sx={{ mr: 1 }} /> Canceled
        </MenuItem>
      </Menu>
    </Box>
  );
}
