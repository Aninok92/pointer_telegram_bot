export interface Service {
  id: string;
  name: string;
  price: number;
  category: 'car' | 'motorcycle' | 'additional';
}

export const services: Service[] = [
  // Car services
  { id: 'car_fender', name: 'Покраска крыла', price: 1000, category: 'car' },
  { id: 'car_door', name: 'Покраска двери', price: 1500, category: 'car' },
  { id: 'car_hood', name: 'Покраска капота', price: 2000, category: 'car' },
  { id: 'car_bumper', name: 'Покраска бампера', price: 1800, category: 'car' },
  { id: 'car_polish', name: 'Полировка кузова', price: 800, category: 'car' },

  // Motorcycle services
  { id: 'moto_tank', name: 'Покраска бака', price: 1200, category: 'motorcycle' },
  { id: 'moto_fender', name: 'Покраска крыла', price: 800, category: 'motorcycle' },
  { id: 'moto_frame', name: 'Покраска рамы', price: 2500, category: 'motorcycle' },
  { id: 'moto_polish', name: 'Полировка', price: 600, category: 'motorcycle' },

  // Additional services
  { id: 'add_cleaning', name: 'Мойка', price: 500, category: 'additional' },
  { id: 'add_wax', name: 'Покрытие воском', price: 700, category: 'additional' },
  { id: 'add_ceramic', name: 'Керамическое покрытие', price: 3000, category: 'additional' }
];

export const categories = {
  car: '🚗 Автомобиль',
  motorcycle: '🏍️ Мотоцикл',
  additional: '🛠 Доп. услуги'
}; 