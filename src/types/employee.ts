export interface Employee {
  id: string;
  name: string;
  role: string;
  services: string[]; // Array of service IDs they can perform
  active: boolean;
  schedule: {
    [key: string]: { // Day of week (0-6)
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
  };
  createdAt?: any;
  updatedAt?: any;
}
