import { parsePDF } from './pdf';
import { parseDOCX } from './docx';
import { parsePPTX } from './pptx';

/**
 * Routes a File to the correct parser based on extension.
 * Returns a ParsedDocument:
 * {
 *   raw: string,        // full extracted text
 *   preview: string,    // first 800 chars
 *   pageCount: number,
 *   wordCount: number,
 *   fileType: string,   // 'PDF' | 'DOCX' | 'PPTX'
 *   sections: string[], // paragraphs for chunked AI processing
 * }
 */
export async function parseDocument(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'pdf':  return parsePDF(file);
    case 'docx': return parseDOCX(file);
    case 'pptx':
    case 'ppt':  return parsePPTX(file);
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}
