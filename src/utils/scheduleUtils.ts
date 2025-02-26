import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmployeeSchedule } from '../types/schedule';

const DEFAULT_SCHEDULE: EmployeeSchedule = {
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
};

export const getEmployeeSchedule = (employeeData: any | null): EmployeeSchedule | null => {
  if (!employeeData) return null;
  
  const schedule = employeeData.schedule || DEFAULT_SCHEDULE;
  
  // Ensure all days are present in weeklySchedule with correct structure
  const weeklySchedule = Object.fromEntries(
    Object.entries(DEFAULT_SCHEDULE.weeklySchedule).map(([day, defaultValue]) => [
      day,
      {
        isWorking: schedule.weeklySchedule?.[day]?.isWorking ?? defaultValue.isWorking,
        timeSlots: Array.isArray(schedule.weeklySchedule?.[day]?.timeSlots)
          ? schedule.weeklySchedule[day].timeSlots
          : defaultValue.timeSlots
      }
    ])
  );
  
  // Ensure exceptions array exists and is valid
  const exceptions = Array.isArray(schedule.exceptions) 
    ? schedule.exceptions.map(exception => ({
        ...exception,
        startDate: exception.startDate || new Date().toISOString(),
        endDate: exception.endDate || new Date().toISOString(),
        type: exception.type || 'holiday',
        timeSlots: Array.isArray(exception.timeSlots) ? exception.timeSlots : []
      }))
    : [];
  
  return {
    weeklySchedule,
    exceptions,
  };
};

export const updateEmployeeSchedule = async (
  employeeId: string,
  schedule: EmployeeSchedule
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      schedule,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating employee schedule:', error);
    throw new Error('Failed to update employee schedule');
  }
};

export const getWorkingDaysCount = (schedule?: EmployeeSchedule): number => {
  if (!schedule || !schedule.weeklySchedule) return 0;
  return Object.values(schedule.weeklySchedule).filter(day => day?.isWorking).length;
};

export const getExceptionsCount = (schedule?: EmployeeSchedule): number => {
  if (!schedule || !Array.isArray(schedule.exceptions)) return 0;
  return schedule.exceptions.length;
};
