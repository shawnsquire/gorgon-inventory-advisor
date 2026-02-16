import { detectAndValidate, type DetectionResult } from './FileDetector';

export interface ProcessedFile {
  fileName: string;
  result: DetectionResult;
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const text = await file.text();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      fileName: file.name,
      result: {
        type: 'unknown',
        data: null,
        error: 'File is not valid JSON.',
      },
    };
  }

  const result = detectAndValidate(json);
  return { fileName: file.name, result };
}

export async function processFiles(files: FileList | File[]): Promise<ProcessedFile[]> {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(processFile));
}
