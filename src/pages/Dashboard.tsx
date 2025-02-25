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
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  employeeId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
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
    { field: 'clientName', headerName: 'Client Name', width: 150 },
    { field: 'clientEmail', headerName: 'Email', width: 200 },
    { field: 'clientPhone', headerName: 'Phone', width: 130 },
    { 
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params) => format(new Date(params.value), 'MM/dd/yyyy'),
    },
    { field: 'time', headerName: 'Time', width: 100 },
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
      const bookingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
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
