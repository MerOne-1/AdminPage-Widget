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
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import ErrorAlert from '../components/ErrorAlert';

interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
  categoryName: string;
  active: boolean;
  order: number;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    categoryId: '',
    active: true,
  });

  const columns: GridColDef[] = [
    { field: 'order', headerName: 'Order', flex: 0.5, minWidth: 70, type: 'number' },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 200 },
    { field: 'categoryName', headerName: 'Category', flex: 1, minWidth: 120 },
    { field: 'duration', headerName: 'Duration (min)', flex: 0.8, minWidth: 100, type: 'number' },
    { field: 'price', headerName: 'Price', flex: 0.8, minWidth: 80, type: 'number' },
    { field: 'active', headerName: 'Active', flex: 0.5, minWidth: 80, type: 'boolean' },
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
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchCategories();
        await fetchServices();
      } catch (error) {
        setError('Failed to load data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Refetch services when categories change to ensure proper linking
  useEffect(() => {
    if (categories.length > 0) {
      fetchServices();
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'serviceCategories'));
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const category = categories.find(c => c.id === data.categoryId);
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          duration: data.duration || 0,
          price: data.price || 0,
          categoryId: data.categoryId || '',
          categoryName: category?.name || 'None',
          active: typeof data.active === 'boolean' ? data.active : true,
          order: data.order || 0,
        };
      });

      // Sort services first by category order, then by service order within category
      servicesData.sort((a, b) => {
        const categoryA = categories.find(c => c.id === a.categoryId);
        const categoryB = categories.find(c => c.id === b.categoryId);
        const categoryOrderDiff = (categoryA?.order || 0) - (categoryB?.order || 0);
        if (categoryOrderDiff !== 0) return categoryOrderDiff;
        return a.order - b.order;
      });

      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const serviceData = {
        ...newService,
        order: newService.order || services.filter(s => s.categoryId === newService.categoryId).length,
        updatedAt: new Date(),
      };

      if (newService.id) {
        await updateDoc(doc(db, 'services', newService.id), serviceData);
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: new Date(),
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
        <Typography variant="h4">Services</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Add Service
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100% - 60px)', width: '100%', overflow: 'hidden' }}>
        <DataGrid
          sx={{
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
              padding: 1,
            },
          }}
          rows={services}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10]}
          loading={loading}
          getRowId={(row) => row.id || Math.random()}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={newService.categoryId || ''}
              label="Category"
              onChange={(e) => setNewService({ ...newService, categoryId: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {categories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Display Order"
            type="number"
            fullWidth
            value={newService.order || (
              services
                .filter(s => s.categoryId === newService.categoryId)
                .length
            )}
            onChange={(e) =>
              setNewService({ ...newService, order: parseInt(e.target.value) })
            }
            helperText="Lower numbers will be displayed first within their category"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
        </Box>
      </Dialog>

      <ErrorAlert
        open={!!error}
        message={error}
        onClose={() => setError('')}
      />
    </Box>
  );
}
