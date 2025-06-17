import PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { messages } from './messages';
import { logger } from './logger';

interface ServiceSummary {
  name: string;
  quantity: number;
  price: number;
}

export const generateInvoice = async (
  summary: { [key: string]: ServiceSummary[] },
  total: number
): Promise<string> => {
  try {
    const tempDir = join(__dirname, '../../temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const pdfPath = join(tempDir, `invoice_${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const stream = doc.pipe(require('fs').createWriteStream(pdfPath));

    // Set font for Cyrillic support
    const fontPath = join(__dirname, '../pdf/fonts/DejaVuSans.ttf');
    doc.font(fontPath);

    // Header
    doc.fontSize(20).text(messages.pdf.title, { align: 'center' });
    doc.moveDown();

    // Date
    const currentDate = new Date().toLocaleDateString('ru-RU');
    doc.fontSize(12).text(`${messages.pdf.date} ${currentDate}`);
    doc.moveDown();

    // Services
    doc.fontSize(14).text(messages.pdf.selectedServices);
    doc.moveDown();

    for (const [category, services] of Object.entries(summary)) {
      doc.fontSize(12).text(`${category.toUpperCase()}:`);
      services.forEach((service) => {
        doc.fontSize(10).text(
          `- ${service.name}: ${service.quantity} x ${service.price} = ${
            service.quantity * service.price
          } ${messages.pdf.currency}`
        );
      });
      doc.moveDown();
    }

    // Total
    doc.fontSize(14).text(
      `${messages.pdf.total} ${total} ${messages.pdf.currency}`,
      { align: 'right' }
    );
    doc.moveDown();

    // Footer
    doc.fontSize(10).text(messages.pdf.thankYou, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        logger.debug('PDF generated successfully', { pdfPath });
        resolve(pdfPath);
      });

      stream.on('error', (error: unknown) => {
        logger.error('Error writing PDF file', error as Error, { pdfPath });
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Error generating PDF', error as Error, { summary, total });
    throw error;
  }
}; 