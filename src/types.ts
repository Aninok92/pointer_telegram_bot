// Common types for the bot

export interface Service {
  name: string;
  price: number;
}

export interface Services {
  car: Service[];
  moto: Service[];
  additional: Service[];
}

export interface SessionData {
  isAdmin?: boolean;
  waitingForPassword?: boolean;
  addingService?: {
    category: string;
    name?: string;
    price?: number;
  };
  editCategory?: string;
  editIndex?: number;
  editStep?: string;
  _newName?: string;
  deleteCategory?: string;
  deleteIndex?: number;
}

export interface UserState {
  selectedServices: Map<string, number>;
  currentCategory: string;
} 