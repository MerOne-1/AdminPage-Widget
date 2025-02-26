export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  categoryId: string;
  active: boolean;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}
