import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import PDFDocument from 'pdfkit';
import { messages } from '../utils/messages';
import { Services } from '../types';

const loadServices = (): Services => {
  try {
    const servicesPath = join(__dirname, '../data/services.json');
    return require(servicesPath);
  } catch (error) {
    console.error('Error loading services:', error);
    throw new Error('Failed to load services data');
  }
};

export const generateInvoice = (
  services: Map<string, number>,
  total: number,
  category: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const now = new Date();
      const fileDate = now.toLocaleDateString('ru-RU').split('.').reverse().join('-');
      const fileTime = now.toLocaleTimeString('ru-RU').replace(/:/g, '-');
      const fileName = `invoice_${category}_${fileDate}_${fileTime}.pdf`;
      const tempDir = join(__dirname, '../../temp');
      const filePath = join(tempDir, fileName);

      // Create temp directory if it doesn't exist
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Connect font
      const fontPath = join(__dirname, 'fonts', 'DejaVuSans.ttf');
      if (!existsSync(fontPath)) {
        throw new Error('Font file not found');
      }
      doc.registerFont('dejavu', fontPath);
      doc.font('dejavu');

      // Create write stream
      const writeStream = createWriteStream(filePath);

      // Handle stream errors
      writeStream.on('error', (error) => {
        console.error('Error writing PDF file:', error);
        reject(error);
      });

      // Handle stream finish
      writeStream.on('finish', () => {
        resolve(filePath);
      });

      // Pipe PDF to file
      doc.pipe(writeStream);

      // Add content
      doc.fontSize(20).text(messages.pdf.title, { align: 'center' });
      doc.moveDown();
      
      const date = new Date().toLocaleDateString('ru-RU');
      doc.fontSize(12).text(`${messages.pdf.date} ${date}`, { align: 'right' });
      doc.moveDown();

      // Add line for vehicle number
      doc.fontSize(12).text(`${messages.pdf.vehicleNumber} ___________________________`);
      doc.moveDown();

      doc.fontSize(14).text(messages.pdf.selectedServices);
      doc.moveDown();

      // Add services
      const allServices = loadServices();
      const categoryServices = allServices[category as keyof Services];

      if (!categoryServices) {
        throw new Error(`Category ${category} not found in services`);
      }

      for (const [serviceName, quantity] of services.entries()) {
        const service = categoryServices.find(s => s.name === serviceName);
        if (service) {
          const serviceTotal = service.price * quantity;
          doc.fontSize(12).text(`- ${serviceName} ×${quantity} – ${serviceTotal} ${messages.pdf.currency}`);
        }
      }

      doc.moveDown();
      doc.fontSize(14).text(`${messages.pdf.total} ${total} ${messages.pdf.currency}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(12).text(messages.pdf.thankYou, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}; 