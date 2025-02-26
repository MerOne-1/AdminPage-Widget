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

export const getEmployeeSchedule = (employeeData: any): EmployeeSchedule => {
  if (!employeeData) return DEFAULT_SCHEDULE;
  
  const schedule = employeeData.schedule || {};
  
  // Ensure all days are present in weeklySchedule
  const weeklySchedule = {
    ...DEFAULT_SCHEDULE.weeklySchedule,
    ...(schedule.weeklySchedule || {})
  };
  
  // Ensure exceptions array exists and is valid
  const exceptions = Array.isArray(schedule.exceptions) ? schedule.exceptions : [];
  
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
