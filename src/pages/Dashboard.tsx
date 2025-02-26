import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, query, orderBy, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';

interface BookingService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  comments?: string;
}

interface Booking {
  id: string;
  services: BookingService[];
  employeeId: string;
  employeeName: string;
  clientInfo: ClientInfo;
  date: string;
  timeSlot: TimeSlot;
  totalDuration: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    todayBookings: 0,
  });

  const columns: GridColDef[] = [
    { 
      field: 'clientName', 
      headerName: 'Client Name', 
      width: 150,
      valueGetter: (params) => `${params.row.clientInfo.firstName} ${params.row.clientInfo.lastName}`,
    },
    { 
      field: 'clientEmail', 
      headerName: 'Email', 
      width: 200,
      valueGetter: (params) => params.row.clientInfo.email,
    },
    { 
      field: 'clientPhone', 
      headerName: 'Phone', 
      width: 130,
      valueGetter: (params) => params.row.clientInfo.phone,
    },
    { 
      field: 'clientAddress', 
      headerName: 'Address', 
      width: 200,
      valueGetter: (params) => params.row.clientInfo.address,
    },
    {
      field: 'services',
      headerName: 'Services',
      width: 250,
      renderCell: (params) => (
        <Box>
          {params.value?.map((service: BookingService, index: number) => (
            <Chip
              key={service.id}
              label={service.name}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          )) || 'No services'}
        </Box>
      ),
    },
    {
      field: 'employeeName',
      headerName: 'Professional',
      width: 150,
    },
    { 
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params) => {
        try {
          return format(new Date(params.value), 'MM/dd/yyyy');
        } catch (error) {
          console.error('Error formatting date:', error);
          return params.value;
        }
      },
    },
    { 
      field: 'time',
      headerName: 'Time',
      width: 150,
      valueGetter: (params) => `${params.row.timeSlot.start} - ${params.row.timeSlot.end}`,
    },
    {
      field: 'totalDuration',
      headerName: 'Duration',
      width: 100,
      valueFormatter: (params) => `${params.value} min`,
    },
    {
      field: 'totalPrice',
      headerName: 'Price',
      width: 100,
      valueFormatter: (params) => `$${params.value}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'confirmed'
              ? 'success'
              : params.value === 'pending'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
  ];

  useEffect(() => {
    // Subscribe to real-time updates for bookings
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Ensure we have default values for potentially missing fields
        return {
          id: doc.id,
          services: data.services || [],
          employeeId: data.employeeId || '',
          employeeName: data.employeeName || 'No asignado',
          clientInfo: {
            firstName: (data.clientInfo?.firstName || data.clientName?.split(' ')[0] || ''),
            lastName: (data.clientInfo?.lastName || data.clientName?.split(' ')[1] || ''),
            email: data.clientInfo?.email || data.clientEmail || '',
            phone: data.clientInfo?.phone || data.clientPhone || '',
            address: data.clientInfo?.address || '',
            comments: data.clientInfo?.comments || ''
          },
          date: data.date || '',
          timeSlot: data.timeSlot || { start: data.time || '', end: '' },
          totalDuration: data.totalDuration || data.duration || 0,
          totalPrice: data.totalPrice || 0,
          status: data.status || 'pending',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        };
      }) as Booking[];
      setBookings(bookingsData);

      // Update stats
      const today = new Date().toISOString().split('T')[0];
      setStats({
        totalBookings: bookingsData.length,
        pendingBookings: bookingsData.filter((b) => b.status === 'pending').length,
        todayBookings: bookingsData.filter((b) => b.date === today).length,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Bookings
              </Typography>
              <Typography variant="h3">{stats.totalBookings}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Bookings
              </Typography>
              <Typography variant="h3">{stats.pendingBookings}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Bookings
              </Typography>
              <Typography variant="h3">{stats.todayBookings}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ height: 'calc(100vh - 300px)' }}>
        <DataGrid
          rows={bookings}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}
