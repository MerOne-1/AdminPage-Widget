import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
  IconButton,
  Switch,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import ErrorAlert from '../components/ErrorAlert';
import { db } from '../config/firebase';

interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    active: true,
  });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    { 
      field: 'active', 
      headerName: 'Active', 
      flex: 0.5, 
      minWidth: 100, 
      type: 'boolean',
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={async (e) => {
            try {
              await updateDoc(doc(db, 'serviceCategories', params.row.id), {
                active: e.target.checked,
                updatedAt: new Date(),
              });
              await fetchCategories();
            } catch (error) {
              setError('Failed to update category status');
            }
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box>
            <IconButton
              size="small"
              onClick={() => handleMove(params.row.id, 'up')}
              disabled={loading || params.row.order === 0}
            >
              <ArrowUpwardIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleMove(params.row.id, 'down')}
              disabled={loading || params.row.order === categories.length - 1}
            >
              <ArrowDownwardIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    console.log('Categories: Starting useEffect...');
    const loadData = async () => {
      console.log('Categories: Loading data...');
      setLoading(true);
      console.log('Categories: Setting loading state...');
      try {
        console.log('Categories: Fetching categories...');
        await fetchCategories();
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    try {
      setLoading(true);
      const currentIndex = categories.findIndex(c => c.id === id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= categories.length) return;
      
      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(currentIndex, 1);
      newCategories.splice(newIndex, 0, movedCategory);
      
      // Update all categories with new order
      await Promise.all(
        newCategories.map((category, index) =>
          updateDoc(doc(db, 'serviceCategories', category.id), {
            order: index,
            updatedAt: new Date(),
          })
        )
      );
      
      await fetchCategories();
    } catch (error) {
      setError('Failed to move category');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'serviceCategories'));
      const categoriesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          active: typeof data.active === 'boolean' ? data.active : true,
          order: data.order || 0,
        };
      });
      // Sort categories by order
      categoriesData.sort((a, b) => a.order - b.order);
      // Sort by order
      categoriesData.sort((a, b) => a.order - b.order);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const categoryData = {
        ...newCategory,
        order: typeof newCategory.order === 'number' ? newCategory.order : categories.length,
        updatedAt: new Date(),
      };
      
      if (newCategory.id) {
        await updateDoc(doc(db, 'serviceCategories', newCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'serviceCategories'), {
          ...categoryData,
          order: categories.length,
          createdAt: new Date(),
        });
      }
      setOpen(false);
      setNewCategory({
        name: '',
        description: '',
        active: true,
      });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setNewCategory(category);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoc(doc(db, 'serviceCategories', id));
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
        <Typography variant="h4">Service Categories</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Add Category
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
          rows={categories}
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
        <DialogTitle>{newCategory.id ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
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
