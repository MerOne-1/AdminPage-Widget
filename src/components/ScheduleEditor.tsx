import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format, parseISO } from 'date-fns';

import { TimeSlot, DaySchedule, WeeklySchedule, Exception, EmployeeSchedule } from '../types/schedule';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  schedule: EmployeeSchedule;
  onSave: (schedule: EmployeeSchedule) => Promise<void>;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ScheduleEditor({ open, onClose, employeeName, schedule, onSave }: Props) {
  const [tab, setTab] = useState(0);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<EmployeeSchedule>(schedule);
  const [newException, setNewException] = useState<Partial<Exception>>({
    type: 'holiday',
    date: new Date().toISOString(),
  });
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);

  const handleAddTimeSlot = (day: string) => {
    const newSchedule = { ...editingSchedule };
    const daySchedule = newSchedule.weeklySchedule[day];
    
    if (daySchedule) {
      daySchedule.timeSlots.push({ start: '09:00', end: '17:00' });
      setEditingSchedule(newSchedule);
    }
  };

  const handleRemoveTimeSlot = (day: string, index: number) => {
    const newSchedule = { ...editingSchedule };
    const daySchedule = newSchedule.weeklySchedule[day];
    
    if (daySchedule) {
      daySchedule.timeSlots.splice(index, 1);
      setEditingSchedule(newSchedule);
    }
  };

  const handleUpdateTimeSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
    const newSchedule = { ...editingSchedule };
    const daySchedule = newSchedule.weeklySchedule[day];
    
    if (daySchedule && daySchedule.timeSlots[index]) {
      daySchedule.timeSlots[index] = {
        ...daySchedule.timeSlots[index],
        [field]: value,
      };
      setEditingSchedule(newSchedule);
    }
  };

  const handleToggleWorkingDay = (day: string) => {
    const newSchedule = { ...editingSchedule };
    const daySchedule = newSchedule.weeklySchedule[day];
    
    if (daySchedule) {
      daySchedule.isWorking = !daySchedule.isWorking;
      if (daySchedule.isWorking && daySchedule.timeSlots.length === 0) {
        daySchedule.timeSlots.push({ start: '09:00', end: '17:00' });
      }
      setEditingSchedule(newSchedule);
    }
  };

  const handleCopySchedule = (fromDay: string) => {
    const newSchedule = { ...editingSchedule };
    const sourceSchedule = newSchedule.weeklySchedule[fromDay];
    
    if (sourceSchedule && selectedDays.length > 0) {
      selectedDays.forEach(day => {
        if (day !== fromDay) {
          newSchedule.weeklySchedule[day] = {
            isWorking: sourceSchedule.isWorking,
            timeSlots: sourceSchedule.timeSlots.map(slot => ({ ...slot })),
          };
        }
      });
      setEditingSchedule(newSchedule);
    }
  };

  const handleAddException = () => {
    if (newException.date && newException.type) {
      const exception: Exception = {
        id: Math.random().toString(36).substr(2, 9),
        date: newException.date,
        type: newException.type,
        note: newException.note,
        timeSlots: newException.timeSlots,
      };

      setEditingSchedule({
        ...editingSchedule,
        exceptions: [...editingSchedule.exceptions, exception],
      });

      setNewException({
        type: 'holiday',
        date: new Date().toISOString(),
      });
      setShowExceptionDialog(false);
    }
  };

  const handleRemoveException = (id: string) => {
    setEditingSchedule({
      ...editingSchedule,
      exceptions: editingSchedule.exceptions.filter(e => e.id !== id),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Schedule for {employeeName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
            <Tab label="Weekly Schedule" />
            <Tab label="Exceptions" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select days to edit together:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {DAYS.map(day => (
                <Chip
                  key={day}
                  label={day}
                  onClick={() => {
                    setSelectedDays(prev => 
                      prev.includes(day) 
                        ? prev.filter(d => d !== day)
                        : [...prev, day]
                    );
                  }}
                  color={selectedDays.includes(day) ? "primary" : "default"}
                />
              ))}
            </Stack>

            {DAYS.map(day => (
              <Paper 
                key={day}
                sx={{ 
                  p: 2, 
                  mb: 2,
                  opacity: selectedDays.length === 0 || selectedDays.includes(day) ? 1 : 0.5 
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ textTransform: 'capitalize' }}>
                      {day}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingSchedule.weeklySchedule[day]?.isWorking}
                          onChange={() => handleToggleWorkingDay(day)}
                        />
                      }
                      label="Working day"
                    />
                  </Box>
                  {editingSchedule.weeklySchedule[day]?.isWorking && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleCopySchedule(day)}
                        disabled={selectedDays.length <= 1}
                      >
                        Copy to selected
                      </Button>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddTimeSlot(day)}
                      >
                        Add time slot
                      </Button>
                    </Box>
                  )}
                </Box>

                {editingSchedule.weeklySchedule[day]?.isWorking && (
                  <Stack spacing={2}>
                    {editingSchedule.weeklySchedule[day]?.timeSlots.map((slot, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Start"
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleUpdateTimeSlot(day, index, 'start', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                        <TextField
                          label="End"
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleUpdateTimeSlot(day, index, 'end', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveTimeSlot(day, index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowExceptionDialog(true)}
              sx={{ mb: 2 }}
            >
              Add Exception
            </Button>

            <Stack spacing={2}>
              {editingSchedule.exceptions
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(exception => (
                  <Paper key={exception.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {format(parseISO(exception.date), 'PP')}
                        </Typography>
                        <Chip
                          size="small"
                          label={exception.type}
                          color={exception.type === 'holiday' ? 'error' : 'warning'}
                          sx={{ mr: 1 }}
                        />
                        {exception.note && (
                          <Typography variant="body2" color="text.secondary">
                            {exception.note}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveException(exception.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    {exception.type === 'modified' && exception.timeSlots && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Modified Schedule:
                        </Typography>
                        <Stack spacing={1}>
                          {exception.timeSlots.map((slot, index) => (
                            <Typography key={index} variant="body2">
                              {slot.start} - {slot.end}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                ))}
            </Stack>
          </Box>
        )}

        <Dialog
          open={showExceptionDialog}
          onClose={() => setShowExceptionDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Exception</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={parseISO(newException.date || new Date().toISOString())}
                  onChange={(date) => {
                    if (date) {
                      setNewException({
                        ...newException,
                        date: date.toISOString(),
                      });
                    }
                  }}
                />
              </LocalizationProvider>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={newException.type === 'holiday'}
                    onChange={(e) => {
                      setNewException({
                        ...newException,
                        type: e.target.checked ? 'holiday' : 'modified',
                        timeSlots: e.target.checked ? undefined : [{ start: '09:00', end: '17:00' }],
                      });
                    }}
                  />
                }
                label="Holiday (Day off)"
              />

              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={newException.note || ''}
                onChange={(e) => {
                  setNewException({
                    ...newException,
                    note: e.target.value,
                  });
                }}
              />

              {newException.type === 'modified' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Time Slots:
                  </Typography>
                  <Stack spacing={2}>
                    {newException.timeSlots?.map((slot, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Start"
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...(newException.timeSlots || [])];
                            newSlots[index] = { ...slot, start: e.target.value };
                            setNewException({
                              ...newException,
                              timeSlots: newSlots,
                            });
                          }}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                        <TextField
                          label="End"
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSlots = [...(newException.timeSlots || [])];
                            newSlots[index] = { ...slot, end: e.target.value };
                            setNewException({
                              ...newException,
                              timeSlots: newSlots,
                            });
                          }}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setNewException({
                              ...newException,
                              timeSlots: newException.timeSlots?.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setNewException({
                          ...newException,
                          timeSlots: [...(newException.timeSlots || []), { start: '09:00', end: '17:00' }],
                        });
                      }}
                    >
                      Add Time Slot
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExceptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddException} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSave(editingSchedule)}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
