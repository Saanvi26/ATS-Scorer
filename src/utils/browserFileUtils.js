import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from './fileValidation';

/**
 * Gets file extension from File object
 * @param {File} file - File object
 * @returns {string} - File extension with dot
 */
export const getFileExtension = (file) => {
  return '.' + file.name.split('.').pop().toLowerCase();
};

/**
 * Detects file type using File.type and additional validation
 * @param {File} file - File object to check
 * @returns {Promise<{mime: string, valid: boolean}>} - File type info
 */
export const detectFileType = async (file) => {
  const extension = getFileExtension(file);
  const mime = file.type || 'application/octet-stream';
  
  return {
    mime,
    valid: ALLOWED_MIME_TYPES.includes(mime) && ALLOWED_EXTENSIONS.includes(extension)
  };
};

/**
 * Converts File to ArrayBuffer
 * @param {File} file - File to convert
 * @returns {Promise<ArrayBuffer>} - File as ArrayBuffer
 */
export const fileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(`File read error: ${error.message}`));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Converts ArrayBuffer to Buffer
 * @param {ArrayBuffer} arrayBuffer - ArrayBuffer to convert
 * @returns {Buffer} - Node.js Buffer
 */
export const arrayBufferToBuffer = (arrayBuffer) => {
  return Buffer.from(arrayBuffer);
};

/**
 * Reads file with progress tracking
 * @param {File} file - File to read
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<ArrayBuffer>} - File contents
 */
export const readFileWithProgress = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          progress
        });
      }
    };
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(`File read error: ${error.message}`));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Reads file as text with progress
 * @param {File} file - File to read
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - File contents as text
 */
export const readFileAsTextWithProgress = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          progress
        });
      }
    };
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error(`File read error: ${error.message}`));
    reader.readAsText(file);
  });
};

/**
 * Validates file size and type
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} - Validation result
 */
export const validateFile = async (file) => {
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }
  
  const fileType = await detectFileType(file);
  return fileType.valid;
};

/**
 * Creates object URL for file
 * @param {File} file - File to create URL for
 * @returns {string} - Object URL
 */
export const createFileURL = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revokes object URL
 * @param {string} url - Object URL to revoke
 */
export const revokeFileURL = (url) => {
  URL.revokeObjectURL(url);
};