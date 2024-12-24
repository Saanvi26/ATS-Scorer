import { fileTypeFromBuffer } from 'file-type';


// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['application/pdf'];
export const ALLOWED_EXTENSIONS = ['.pdf'];

/**
 * Validates if a file is a PDF
 * @param {File} file - File object to validate
 * @returns {Promise<boolean>} - True if file is valid PDF
 */
export const isPDF = async (file) => {
  try {
    const buffer = await convertFileToBuffer(file);
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) return false;

    return ALLOWED_MIME_TYPES.includes(fileType.mime) &&
      ALLOWED_EXTENSIONS.includes(getFileExtension(file.name));
  } catch (error) {
    throw new Error(generateErrorMessage('PDF_VALIDATION_ERROR', error.message));
  }
};

/**
 * Validates file size
 * @param {File} file - File object to validate
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {Promise<boolean>} - True if file size is valid
 */
export const isValidFileSize = async (file, maxSize = MAX_FILE_SIZE) => {
  try {
    return file.size <= maxSize;
  } catch (error) {
    throw new Error(generateErrorMessage('FILE_SIZE_ERROR', error.message));
  }
};

/**
 * Validates file MIME type
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Promise<boolean>} - True if MIME type is valid
 */
export const isValidMimeType = async (fileBuffer) => {
  try {
    const fileType = await fileTypeFromBuffer(fileBuffer);
    return fileType && ALLOWED_MIME_TYPES.includes(fileType.mime);
  } catch (error) {
    throw new Error(generateErrorMessage('MIME_TYPE_ERROR', error.message));
  }
};

/**
 * Converts File object to ArrayBuffer
 * @param {File} file - File object to convert
 * @returns {Promise<ArrayBuffer>} - File buffer
 */
export const convertFileToBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(generateErrorMessage('FILE_READ_ERROR', error.message)));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Reads file and returns buffer
 * @param {File} file - File object to read
 * @returns {Promise<ArrayBuffer>} - File buffer
 */
export const readFileBuffer = async (file) => {
  try {
    return await convertFileToBuffer(file);
  } catch (error) {
    throw new Error(generateErrorMessage('FILE_READ_ERROR', error.message));
  }
};

/**
 * Gets file extension from filename
 * @param {string} filename - Name of the file
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return '.' + filename.split('.').pop().toLowerCase();
};

/**
 * Generates error message
 * @param {string} type - Error type
 * @param {string} details - Error details
 * @returns {string} - Formatted error message
 */
export const generateErrorMessage = (type, details) => {
  const errorMessages = {
    PDF_VALIDATION_ERROR: 'Invalid PDF file',
    FILE_SIZE_ERROR: 'File size exceeds limit',
    MIME_TYPE_ERROR: 'Invalid file type',
    FILE_READ_ERROR: 'Error reading file'
  };

  return `${errorMessages[type]}: ${details}`;
};
