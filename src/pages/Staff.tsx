import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import ErrorAlert from '../components/ErrorAlert';
import { db } from '../config/firebase';

interface Employee {
  id: string;
  name: string;
  role: string;
  active: boolean;
  services: string[];
  schedule: {
    [key: string]: { start: string; end: string };
  };
  createdAt: any;
  updatedAt: any;
}

export default function Staff() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    role: '',
    active: true,
    services: [],
  });
  const [isEditing, setIsEditing] = useState(false);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'role', headerName: 'Role', flex: 1, minWidth: 150 },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => handleEdit(params.row)}
            size="small"
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        const employeesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees');
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleClose = () => {
    setOpen(false);
    setError('');
    setIsEditing(false);
    setNewEmployee({
      name: '',
      role: '',
      active: true,
      services: [],
    });
  };

  const handleEdit = (employee: Employee) => {
    setNewEmployee(employee);
    setIsEditing(true);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      setEmployees(employees.filter((employee) => employee.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee');
    }
  };

  const handleSave = async () => {
    if (!newEmployee.name?.trim() || !newEmployee.role?.trim()) {
      setError('Name and Role are required');
      return;
    }

    try {
      const employeeData = {
        ...newEmployee,
        updatedAt: new Date(),
      };

      if (!isEditing) {
        const docRef = await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: new Date(),
        });
        setEmployees([...employees, { ...employeeData, id: docRef.id } as Employee]);
      } else {
        const docRef = doc(db, 'employees', newEmployee.id!);
        await updateDoc(docRef, employeeData);
        setEmployees(
          employees.map((emp) =>
            emp.id === newEmployee.id ? { ...employeeData, id: emp.id } as Employee : emp
          )
        );
      }

      handleClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Failed to save employee');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Staff Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setNewEmployee({
              name: '',
              role: '',
              active: true,
              services: [],
            });
            setIsEditing(false);
            setOpen(true);
          }}
          startIcon={<PersonAddIcon />}
        >
          Add Employee
        </Button>
      </Box>

      {error && <ErrorAlert message={error} />}

      <Paper sx={{ height: 'calc(100vh - 130px)', mb: 2 }}>
        <DataGrid
          rows={employees}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          getRowId={(row) => row.id}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Employee' : 'Add Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Role"
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
              fullWidth
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newEmployee.active}
                  onChange={(e) => setNewEmployee({ ...newEmployee, active: e.target.checked })}
                  color="primary"
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
