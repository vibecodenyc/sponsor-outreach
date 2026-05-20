import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Extracts text from a PDF File object.
 * Returns structured content ready for AI processing.
 */
export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageCount = pdf.numPages;
  const pages = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Preserve line breaks by grouping items by Y position
    const lines = [];
    let lastY = null;
    let currentLine = [];

    for (const item of textContent.items) {
      if ('str' in item) {
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.length) lines.push(currentLine.join(' '));
          currentLine = [];
        }
        if (item.str.trim()) currentLine.push(item.str);
        lastY = y;
      }
    }
    if (currentLine.length) lines.push(currentLine.join(' '));

    pages.push(lines.join('\n'));
  }

  const raw = pages.join('\n\n').trim();
  const wordCount = raw.split(/\s+/).filter(Boolean).length;

  return {
    raw,
    preview: raw.slice(0, 800),
    pageCount,
    wordCount,
    fileType: 'PDF',
    // Sections split by double newlines — useful for chunked AI processing
    sections: raw.split(/\n{2,}/).map(s => s.trim()).filter(s => s.length > 20),
  };
}
