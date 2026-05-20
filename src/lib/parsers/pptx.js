/**
 * PPTX parser — stub for future implementation.
 * Planned: use pptx2json or a backend service to extract slide text.
 * Client-side PPTX parsing requires unzipping the .pptx (ZIP format)
 * and parsing the XML slide files — feasible with JSZip + xml2js.
 */
export async function parsePPTX(_file) {
  throw new Error('PPTX parsing is not yet implemented. Coming soon.');
}
