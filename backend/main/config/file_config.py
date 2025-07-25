# Configuración de subida de archivos

# Extensiones de archivo permitidas
ALLOWED_EXTENSIONS = {
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'csv', 
    'doc', 'docx', 'xls', 'xlsx'
}

# Tamaño máximo de archivo (en bytes)
# Puedes modificar este valor según tus necesidades
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# MIME types permitidos para mayor seguridad
ALLOWED_MIME_TYPES = {
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
}

# Configuraciones adicionales
MAX_FILENAME_LENGTH = 255  # Longitud máxima del nombre del archivo
