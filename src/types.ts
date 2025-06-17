// Common types for the bot

export interface Service {
  name: string;
  price: number;
}

export interface Services {
  [category: string]: Service[];
}

export interface AdminState {
  step: string;
  category?: string;
  name?: string;
  price?: number;
  serviceIndex?: number;
  newName?: string;
  newPrice?: number;
}

export interface SessionData {
  isAdmin?: boolean;
  adminState?: AdminState;
  selectedServices?: { [category: string]: { [index: string]: number } };
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