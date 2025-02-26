export interface TimeSlot {
  start: string;  // HH:mm format
  end: string;    // HH:mm format
}

export interface DaySchedule {
  isWorking: boolean;
  timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
  [day: string]: DaySchedule;
}

export interface Exception {
  id: string;
  date: string;  // ISO date string
  type: 'holiday' | 'modified';
  timeSlots?: TimeSlot[];  // only for modified type
  note?: string;
}

export interface EmployeeSchedule {
  weeklySchedule: WeeklySchedule;
  exceptions: Exception[];
}
