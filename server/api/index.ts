// Ensure PDFKit standard fonts are traced and bundled by @vercel/nft for Vercel Serverless deployment
try {
  require('pdfkit/standard-fonts/Helvetica');
  require('pdfkit/standard-fonts/HelveticaBold');
  require('pdfkit/standard-fonts/HelveticaOblique');
  require('pdfkit/standard-fonts/HelveticaBoldOblique');
  require('pdfkit/standard-fonts/TimesRoman');
  require('pdfkit/standard-fonts/TimesBold');
  require('pdfkit/standard-fonts/Courier');
  require('pdfkit/standard-fonts/CourierBold');
  require('pdfkit/standard-fonts/Symbol');
  require('pdfkit/standard-fonts/ZapfDingbats');
} catch {}

import app from '../src/app';

export default app;
