import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
  active: boolean;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    active: true,
  });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'duration', headerName: 'Duration (min)', width: 130, type: 'number' },
    { field: 'price', headerName: 'Price', width: 130, type: 'number' },
    { field: 'active', headerName: 'Active', width: 130, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const querySnapshot = await getDocs(collection(db, 'services'));
    const servicesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
    setServices(servicesData);
  };

  const handleSubmit = async () => {
    try {
      if (newService.id) {
        await updateDoc(doc(db, 'services', newService.id), {
          ...newService,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'services'), {
          ...newService,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      setOpen(false);
      setNewService({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        active: true,
      });
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setNewService(service);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Services</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Service
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100% - 60px)' }}>
        <DataGrid
          rows={services}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10]}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{newService.id ? 'Edit Service' : 'New Service'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Duration (minutes)"
            type="number"
            fullWidth
            value={newService.duration}
            onChange={(e) =>
              setNewService({ ...newService, duration: parseInt(e.target.value) })
            }
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={newService.price}
            onChange={(e) =>
              setNewService({ ...newService, price: parseFloat(e.target.value) })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
