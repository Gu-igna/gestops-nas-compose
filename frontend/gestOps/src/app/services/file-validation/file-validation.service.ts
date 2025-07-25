import { Injectable } from '@angular/core';

export interface FileValidationConfig {
  tipos_permitidos: string[];
  tamano_maximo_mb: number;
  tamano_maximo_bytes: number;
  mime_types_permitidos: string[];
  ejemplos: {
    documentos: string[];
    imagenes: string[];
    hojas_calculo: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class FileValidationService {
  
  // Configuración hardcodeada que coincide con el backend
  private readonly validationConfig: FileValidationConfig = {
    tipos_permitidos: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx'],
    tamano_maximo_mb: 10,
    tamano_maximo_bytes: 10 * 1024 * 1024, // 10 MB
    mime_types_permitidos: [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/gif',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    ejemplos: {
      documentos: ['pdf', 'txt', 'doc', 'docx'],
      imagenes: ['jpg', 'jpeg', 'png', 'gif'],
      hojas_calculo: ['csv', 'xls', 'xlsx']
    }
  };

  constructor() { }

  /**
   * Obtiene la configuración de validación de archivos
   */
  getValidationConfig(): FileValidationConfig {
    return this.validationConfig;
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: File): { isValid: boolean; message: string } {
    // Validar tamaño
    if (file.size > this.validationConfig.tamano_maximo_bytes) {
      return {
        isValid: false,
        message: 'El archivo excede el tamaño máximo.'
      };
    }

    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.validationConfig.tipos_permitidos.includes(extension)) {
      return {
        isValid: false,
        message: 'Tipo de archivo no permitido.'
      };
    }

    // Validar tipo MIME
    if (!this.validationConfig.mime_types_permitidos.includes(file.type)) {
      return {
        isValid: false,
        message: `Tipo de contenido no permitido: ${file.type}`
      };
    }

    return { isValid: true, message: 'Archivo válido' };
  }

  /**
   * Obtiene el string accept para inputs de archivo basado en las extensiones permitidas
   */
  getAcceptString(): string {
    return this.validationConfig.tipos_permitidos.map(ext => `.${ext}`).join(',');
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Verifica si una extensión de archivo está permitida
   */
  isExtensionAllowed(extension: string): boolean {
    return this.validationConfig.tipos_permitidos.includes(extension.toLowerCase());
  }

  /**
   * Obtiene el tamaño máximo permitido en bytes
   */
  getMaxSizeBytes(): number {
    return this.validationConfig.tamano_maximo_bytes;
  }

  /**
   * Obtiene el tamaño máximo permitido en MB
   */
  getMaxSizeMB(): number {
    return this.validationConfig.tamano_maximo_mb;
  }
}
