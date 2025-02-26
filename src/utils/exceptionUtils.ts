import { addDays } from 'date-fns';
import { Exception, EmployeeSchedule } from '../types/schedule';

export const createException = (
  startDate: string,
  endDate: string,
  type: 'holiday' | 'modified',
  note?: string,
  timeSlots?: { start: string; end: string }[]
): Exception => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    startDate,
    endDate,
    type,
    note: note || '',
    timeSlots: type === 'modified' ? (timeSlots || []) : [],
  };
};

export const addException = (
  schedule: EmployeeSchedule,
  exception: Exception
): EmployeeSchedule => {
  return {
    ...schedule,
    exceptions: [...(schedule.exceptions || []), exception],
  };
};

export const removeException = (
  schedule: EmployeeSchedule,
  exceptionId: string
): EmployeeSchedule => {
  return {
    ...schedule,
    exceptions: (schedule.exceptions || []).filter(e => e.id !== exceptionId),
  };
};

export const getDefaultException = (): Exception => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'holiday',
  startDate: new Date().toISOString(),
  endDate: addDays(new Date(), 1).toISOString(),
  note: '',
  timeSlots: [],
});
