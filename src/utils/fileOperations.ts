import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Services } from '../types';

const servicesPath = join(__dirname, '../data/services.json');

export const loadServices = async (): Promise<Services> => {
  const data = await readFile(servicesPath, 'utf-8');
  return JSON.parse(data);
};

export const saveServices = async (services: Services): Promise<void> => {
  await writeFile(servicesPath, JSON.stringify(services, null, 2));
}; 