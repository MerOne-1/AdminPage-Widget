import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ScheduleEditor from '../components/ScheduleEditor.tsx';
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
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getEmployeeSchedule, getWorkingDaysCount, getExceptionsCount, updateEmployeeSchedule } from '../utils/scheduleUtils';
import ErrorAlert from '../components/ErrorAlert';
import { db } from '../config/firebase';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
}

import { EmployeeSchedule } from '../types/schedule';

interface Employee {
  id: string;
  name: string;
  role: string;
  active: boolean;
  services: string[];
  schedule: EmployeeSchedule;
  createdAt: any;
  updatedAt: any;
}

export default function Staff() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    role: '',
    active: true,
    services: [],
    schedule: {
      weeklySchedule: {
        monday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
        tuesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
        wednesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
        thursday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
        friday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
        saturday: { isWorking: false, timeSlots: [] },
        sunday: { isWorking: false, timeSlots: [] },
      },
      exceptions: [],
    },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);


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
      field: 'services',
      headerName: 'Services',
      width: 150,
      renderCell: (params) => {
        const serviceCount = params.value?.length || 0;
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${serviceCount} service${serviceCount !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={() => {
                setSelectedEmployee(params.row);
                setServiceDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: 'schedule',
      headerName: 'Schedule',
      width: 200,
      renderCell: (params) => {
        const schedule = params.value ? getEmployeeSchedule(params.row) : undefined;
        const workingDays = getWorkingDaysCount(schedule);
        const exceptions = getExceptionsCount(schedule);
        
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2">
                {workingDays} working days
              </Typography>
              {exceptions > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {exceptions} exception{exceptions !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={() => handleScheduleClick(params.row)}
              sx={{ ml: 'auto' }}
            >
              <AccessTimeIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
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
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch employees
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employeesData = employeesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);

        // Fetch services
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        setServices(servicesData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
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

  const handleUpdateServices = async () => {
    if (!selectedEmployee) return;

    try {
      await updateDoc(doc(db, 'employees', selectedEmployee.id), {
        services: selectedEmployee.services,
        updatedAt: new Date(),
      });

      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id ? selectedEmployee : emp
      ));
      setServiceDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error updating employee services:', error);
      setError('Failed to update employee services');
    }
  };

  const handleScheduleUpdate = async (newSchedule: EmployeeSchedule) => {
    if (!selectedEmployee) return;

    try {
      await updateDoc(doc(db, 'employees', selectedEmployee.id), {
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, schedule: newSchedule } : emp
      ));
      setScheduleDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error updating employee schedule:', error);
      setError('Failed to update employee schedule');
    }
  };

  const handleScheduleClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setScheduleDialogOpen(true);
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

      <Dialog
        open={serviceDialogOpen}
        onClose={() => {
          setServiceDialogOpen(false);
          setSelectedEmployee(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEmployee ? `Edit Services for ${selectedEmployee.name}` : 'Edit Employee Services'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="services-label">Services</InputLabel>
              <Select
                labelId="services-label"
                multiple
                value={selectedEmployee?.services || []}
                onChange={(e) => {
                  if (selectedEmployee) {
                    const newServices = e.target.value as string[];
                    setSelectedEmployee({
                      ...selectedEmployee,
                      services: newServices,
                    });
                  }
                }}
                input={<OutlinedInput label="Services" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const service = services.find(s => s.id === value);
                      return service ? (
                        <Chip
                          key={value}
                          label={service.name}
                          size="small"
                          onDelete={() => {
                            if (selectedEmployee) {
                              setSelectedEmployee({
                                ...selectedEmployee,
                                services: selectedEmployee.services.filter(id => id !== value)
                              });
                            }
                          }}
                          color="primary"
                        />
                      ) : null;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    },
                  },
                }}
              >
                {services
                  .filter(service => service.active)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((service) => (
                    <MenuItem 
                      key={service.id} 
                      value={service.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {selectedEmployee?.services?.includes(service.id) ? 
                        <CheckBoxIcon color="primary" fontSize="small" /> : 
                        <CheckBoxOutlineBlankIcon fontSize="small" />
                      }
                      <Box>{service.name}</Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setServiceDialogOpen(false);
              setSelectedEmployee(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateServices} 
            variant="contained" 
            color="primary"
            disabled={!selectedEmployee?.services?.length}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ScheduleEditor
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          setSelectedEmployee(null);
        }}
        employeeName={selectedEmployee?.name || ''}
        schedule={selectedEmployee?.schedule || {
          weeklySchedule: {
            monday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            tuesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            wednesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            thursday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            friday: { isWorking: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            saturday: { isWorking: false, timeSlots: [] },
            sunday: { isWorking: false, timeSlots: [] },
          },
          exceptions: [],
        }}
        onSave={async (newSchedule) => {
          if (selectedEmployee) {
            try {
              await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                schedule: newSchedule,
                updatedAt: new Date(),
              });
              
              setEmployees(employees.map(emp => 
                emp.id === selectedEmployee.id 
                  ? { ...selectedEmployee, schedule: newSchedule }
                  : emp
              ));
              setScheduleDialogOpen(false);
              setSelectedEmployee(null);
            } catch (error) {
              console.error('Error updating employee schedule:', error);
              setError('Failed to update employee schedule');
            }
          }
        }}
      />
    </Box>
  );
}
