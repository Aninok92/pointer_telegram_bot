import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Services } from '../types';

const servicesPath = join(__dirname, '../data/services.json');

export const loadServices = async (): Promise<Services> => {
  try {
    const data = await readFile(servicesPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading services:', error);
    return {};
  }
};

export const saveServices = async (services: Services): Promise<void> => {
  try {
    await writeFile(servicesPath, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error('Error saving services:', error);
    throw error;
  }
}; 