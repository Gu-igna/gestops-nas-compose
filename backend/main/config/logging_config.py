"""
Configuración de logging estructurado para GestOps
Proporciona logging JSON, niveles por ambiente y rotación automática
"""

import os
import sys
import json
import logging
import logging.handlers
from datetime import datetime
from pathlib import Path
from flask import has_request_context, request, g
from flask_jwt_extended import get_jwt_identity

class JSONFormatter(logging.Formatter):
    """
    Formateador JSON personalizado para logs estructurados
    """
    
    def format(self, record):
        """Convierte el log record a formato JSON estructurado"""
        
        # Información básica del log
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Información de contexto Flask si existe
        if has_request_context():
            try:
                log_entry.update({
                    'request': {
                        'method': request.method,
                        'url': request.url,
                        'endpoint': request.endpoint,
                        'remote_addr': request.remote_addr,
                        'user_agent': request.headers.get('User-Agent', 'Unknown')
                    }
                })
                
                # Usuario autenticado si existe
                try:
                    user_id = get_jwt_identity()
                    if user_id:
                        log_entry['user_id'] = user_id
                except:
                    pass
                    
            except Exception as e:
                log_entry['request_context_error'] = str(e)
        
        # Información de excepción si existe
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }
        
        # Datos adicionales del record
        if hasattr(record, 'extra_data'):
            log_entry['extra'] = record.extra_data
            
        return json.dumps(log_entry, ensure_ascii=False)

class GestOpsLogger:
    """
    Configurador principal de logging para GestOps
    """
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Inicializa el sistema de logging con la aplicación Flask"""
        
        # Configuración desde variables de entorno
        environment = os.getenv('ENVIRONMENT', 'development')
        log_level = self._get_log_level(environment)
        log_dir = os.getenv('LOG_DIR', 'logs')
        
        # Crear directorio de logs
        Path(log_dir).mkdir(exist_ok=True)
        
        # Configurar root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        
        # Limpiar handlers existentes
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Handler para archivo principal (JSON)
        main_file_handler = self._create_file_handler(
            filename=f"{log_dir}/gestops.log",
            level=log_level,
            use_json=True
        )
        
        # Handler para errores (JSON)
        error_file_handler = self._create_file_handler(
            filename=f"{log_dir}/gestops-errors.log",
            level=logging.ERROR,
            use_json=True
        )
        
        # Handler para consola (desarrollo)
        console_handler = self._create_console_handler(environment)
        
        # Agregar handlers
        root_logger.addHandler(main_file_handler)
        root_logger.addHandler(error_file_handler)
        if environment == 'development':
            root_logger.addHandler(console_handler)
        
        # Configurar loggers específicos
        self._configure_specific_loggers(environment)
        
        # Log inicial
        app.logger.info("Sistema de logging inicializado", extra={
            'extra_data': {
                'environment': environment,
                'log_level': logging.getLevelName(log_level),
                'log_dir': log_dir
            }
        })
    
    def _get_log_level(self, environment):
        """Determina el nivel de log según el ambiente"""
        
        levels = {
            'development': logging.DEBUG,
            'testing': logging.INFO,
            'staging': logging.WARNING,
            'production': logging.ERROR
        }
        
        return levels.get(environment, logging.INFO)
    
    def _create_file_handler(self, filename, level, use_json=True):
        """Crea un handler de archivo con rotación"""
        
        handler = logging.handlers.RotatingFileHandler(
            filename=filename,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        
        handler.setLevel(level)
        
        if use_json:
            handler.setFormatter(JSONFormatter())
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
        
        return handler
    
    def _create_console_handler(self, environment):
        """Crea handler para consola (solo desarrollo)"""
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG if environment == 'development' else logging.INFO)
        
        # Formato más legible para consola
        formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        return handler
    
    def _configure_specific_loggers(self, environment):
        """Configura loggers específicos para diferentes módulos"""
        
        # Silenciar logs verbosos en producción
        if environment == 'production':
            logging.getLogger('werkzeug').setLevel(logging.WARNING)
            logging.getLogger('urllib3').setLevel(logging.WARNING)
        
        # Logger para operaciones de base de datos
        db_logger = logging.getLogger('gestops.database')
        db_logger.setLevel(logging.INFO if environment == 'development' else logging.WARNING)
        
        # Logger para autenticación
        auth_logger = logging.getLogger('gestops.auth')
        auth_logger.setLevel(logging.INFO)
        
        # Logger para operaciones críticas
        critical_logger = logging.getLogger('gestops.critical')
        critical_logger.setLevel(logging.WARNING)

def get_logger(name):
    """
    Obtiene un logger configurado para el módulo especificado
    """
    return logging.getLogger(f'gestops.{name}')

def log_request_response(func):
    """
    Decorador para logging automático de requests y responses
    """
    def wrapper(*args, **kwargs):
        logger = get_logger('api')
        
        # Log de request
        if has_request_context():
            logger.info("Request iniciado", extra={
                'extra_data': {
                    'endpoint': request.endpoint,
                    'method': request.method,
                    'args': dict(request.args),
                    'json_size': len(str(request.get_json())) if request.is_json else 0
                }
            })
        
        try:
            result = func(*args, **kwargs)
            
            # Log de response exitoso
            logger.info("Request completado exitosamente", extra={
                'extra_data': {
                    'endpoint': request.endpoint if has_request_context() else 'N/A'
                }
            })
            
            return result
            
        except Exception as e:
            # Log de error
            logger.error(f"Error en request: {str(e)}", extra={
                'extra_data': {
                    'endpoint': request.endpoint if has_request_context() else 'N/A',
                    'error_type': type(e).__name__
                }
            }, exc_info=True)
            raise
    
    return wrapper
