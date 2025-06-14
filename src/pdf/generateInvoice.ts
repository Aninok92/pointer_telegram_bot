import PDFDocument from 'pdfkit';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';

interface Service {
  name: string;
  price: number;
}

interface Services {
  car: Service[];
  moto: Service[];
  additional: Service[];
}

const loadServices = (): Services => {
  const servicesPath = join(__dirname, '../data/services.json');
  return JSON.parse(readFileSync(servicesPath, 'utf-8'));
};

export const generateInvoice = async (
  services: Map<string, number>,
  category: string,
  total: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `invoice_${Date.now()}.pdf`;
      const tempDir = join(__dirname, '../../temp');
      const filePath = join(tempDir, fileName);

      // Create temp directory if it doesn't exist
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Подключаем шрифт
      const fontPath = join(__dirname, 'fonts', 'DejaVuSans.ttf');
      doc.registerFont('dejavu', fontPath);
      doc.font('dejavu');

      // Create write stream
      const writeStream = createWriteStream(filePath);

      // Handle stream errors
      writeStream.on('error', (error) => {
        reject(error);
      });

      // Handle stream finish
      writeStream.on('finish', () => {
        resolve(filePath);
      });

      // Pipe PDF to file
      doc.pipe(writeStream);

      // Add content
      doc.fontSize(20).text('Малярная студия "Название"', { align: 'center' });
      doc.moveDown();
      
      const date = new Date().toLocaleDateString('ru-RU');
      doc.fontSize(12).text(`Дата: ${date}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(14).text('Выбранные услуги:');
      doc.moveDown();

      // Add services
      const allServices = loadServices();
      const categoryServices = allServices[category as keyof Services];

      for (const [serviceName, quantity] of services.entries()) {
        const service = categoryServices.find(s => s.name === serviceName);
        if (service) {
          const serviceTotal = service.price * quantity;
          doc.fontSize(12).text(`- ${serviceName} ×${quantity} – ${serviceTotal} MDL`);
        }
      }

      doc.moveDown();
      doc.fontSize(14).text(`Итого: ${total} MDL`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(12).text('Спасибо за обращение!', { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}; 