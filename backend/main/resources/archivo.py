from flask_restful import Resource, current_app
from flask import request, send_file
from werkzeug.utils import secure_filename
import os, uuid
from .. import db
from main.models import OperacionModel, UsuarioModel
from flask_jwt_extended import get_jwt_identity
from main.auth.decorators import role_required
from main.config.file_config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, ALLOWED_MIME_TYPES

def validate_file(file, field_name):
    """Validación completa del archivo"""
    if not file or not file.filename:
        return False, f'No se proporcionó un archivo válido para {field_name}'
    
    # Validar extensión
    if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS):
        allowed_ext = ', '.join(ALLOWED_EXTENSIONS)
        return False, f'Tipo de archivo no permitido para {field_name}. Extensiones permitidas: {allowed_ext}'
    
    # Validar tamaño
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Volver al inicio del archivo
    
    if file_size > MAX_FILE_SIZE:
        max_size_mb = MAX_FILE_SIZE // (1024 * 1024)
        return False, f'El archivo {field_name} excede el tamaño máximo permitido de {max_size_mb}MB'
    
    # Validar tipo MIME
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False, f'Tipo de contenido no permitido para {field_name}: {file.content_type}'
    
    return True, 'Archivo válido'

def procesar_archivo(file, upload_folder):
    """Procesa y guarda un archivo validado - solo retorna el nombre del archivo"""
    filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
    
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    
    # Solo retornamos el nombre del archivo, no el path completo
    return filename, file.content_type

class ArchivoOperacion(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self, id_operacion, campo_archivo):
        try:
            operacion = OperacionModel.query.get(id_operacion)
            if not operacion:
                return {'message': 'Operación no encontrada'}, 404

            filename = getattr(operacion, f"{campo_archivo}_path", None)

            if not filename:
                return {'message': f'El archivo {campo_archivo} no está registrado'}, 404

            # Construir el path completo usando la variable de entorno
            upload_folder = current_app.config['UPLOAD_FOLDER']
            full_path = os.path.join(upload_folder, filename)

            if not os.path.exists(full_path):
                return {'message': f'El archivo {campo_archivo} no existe o no es accesible'}, 404

            return send_file(full_path)

        except Exception as e:
            return {'message': 'Error al obtener el archivo', 'error': str(e)}, 500

    @role_required(roles=["admin", "supervisor"])
    def delete(self, id_operacion, campo_archivo):
        """Elimina un archivo específico de una operación"""
        try:
            operacion = OperacionModel.query.get(id_operacion)
            if not operacion:
                return {'message': 'Operación no encontrada'}, 404

            usuario_actual_id = get_jwt_identity()
            usuario_actual = UsuarioModel.query.get(usuario_actual_id)

            es_creador = int(operacion.id_usuario) == int(usuario_actual_id)
            es_supervisor = "supervisor" == str(usuario_actual.rol)

            if not (es_creador or es_supervisor):
                return {'message': 'No tienes permiso para eliminar este archivo'}, 403

            if es_supervisor and not es_creador:
                operacion.modificado_por_otro = True

            if es_creador and not es_supervisor:
                operacion.modificado_por_otro = False

            campos_validos = ['comprobante', 'archivo1', 'archivo2', 'archivo3']
            if campo_archivo not in campos_validos:
                return {'message': f'Campo de archivo "{campo_archivo}" no permitido'}, 400

            filename = getattr(operacion, f"{campo_archivo}_path", None)
            if filename:
                self._eliminar_archivo_si_existe(filename)
                setattr(operacion, f"{campo_archivo}_path", None)
                db.session.commit()
                return {'message': f'Archivo "{campo_archivo}" eliminado correctamente'}, 200

            return {'message': f'El archivo "{campo_archivo}" no existe'}, 404

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al eliminar el archivo', 'error': str(e)}, 500

    def _eliminar_archivo_si_existe(self, filename):
        """Elimina el archivo físico usando el filename y la variable de entorno"""
        if filename:
            upload_folder = current_app.config['UPLOAD_FOLDER']
            full_path = os.path.join(upload_folder, filename)
            if os.path.exists(full_path):
                os.remove(full_path)

    @role_required(roles=["admin", "supervisor"])
    def patch(self, id_operacion, campo_archivo):
        """Actualiza un archivo específico de una operación"""
        try:
            operacion = OperacionModel.query.get(id_operacion)
            if not operacion:
                return {'message': 'Operación no encontrada'}, 404

            usuario_actual_id = get_jwt_identity()
            usuario_actual = UsuarioModel.query.get(usuario_actual_id)

            es_creador = int(operacion.id_usuario) == int(usuario_actual_id)
            es_supervisor = "supervisor" == str(usuario_actual.rol)

            if not (es_creador or es_supervisor):
                return {'message': 'No tienes permiso para editar esta operación'}, 403

            if es_supervisor and not es_creador:
                operacion.modificado_por_otro = True

            if es_creador and not es_supervisor :
                operacion.modificado_por_otro = False

            campos_validos = ['comprobante', 'archivo1', 'archivo2', 'archivo3']
            if campo_archivo not in campos_validos:
                return {'message': f'Campo de archivo "{campo_archivo}" no permitido'}, 400

            if campo_archivo not in request.files:
                return {'message': f'No se envió el archivo "{campo_archivo}"'}, 400

            file = request.files[campo_archivo]

            # Validar el archivo
            is_valid, validation_message = validate_file(file, campo_archivo)
            if not is_valid:
                return {'message': validation_message}, 400

            if file and file.filename:
                # Eliminar archivo anterior si existe
                old_filename = getattr(operacion, f"{campo_archivo}_path")
                if old_filename:
                    self._eliminar_archivo_si_existe(old_filename)

                upload_folder = current_app.config['UPLOAD_FOLDER']
                filename, content_type = procesar_archivo(file, upload_folder)

                # Guardar solo el nombre del archivo, no el path completo
                setattr(operacion, f"{campo_archivo}_path", filename)

                db.session.commit()

                return {
                    'message': f'Archivo "{campo_archivo}" actualizado correctamente',
                    'archivo_actualizado': campo_archivo,
                    'modificado_por_otro': operacion.modificado_por_otro
                }, 200

            return {'message': f'El archivo "{campo_archivo}" no es válido'}, 400

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al actualizar el archivo', 'error': str(e)}, 500

class ArchivosOperaciones(Resource):
    @role_required(roles=["admin"])
    def post(self, id_operacion):
        try:
            operacion = OperacionModel.query.get(id_operacion)
            if not operacion:
                return {'message': 'Operación no encontrada'}, 404
            
            archivos_procesados = []
            campos_archivo = ['comprobante', 'archivo1', 'archivo2', 'archivo3']
            
            for campo in campos_archivo:
                if campo in request.files:
                    try:
                        filename, content_type = self._procesar_archivo(campo)
                        if filename:  # Solo si se procesó correctamente
                            setattr(operacion, f"{campo}_path", filename)
                            setattr(operacion, f"{campo}_tipo", content_type)
                            archivos_procesados.append(campo)
                    except ValueError as e:
                        return {'message': str(e)}, 400
            
            if not archivos_procesados:
                return {'message': 'No se proporcionaron archivos válidos'}, 400
            
            db.session.commit()
            
            return {
                'message': 'Archivos adjuntados correctamente',
                'archivos_procesados': archivos_procesados,
                'limite_tamaño_mb': MAX_FILE_SIZE // (1024 * 1024),
                'tipos_permitidos': list(ALLOWED_EXTENSIONS)
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al adjuntar archivos', 'error': str(e)}, 500
    
    def _procesar_archivo(self, file_key):
        if file_key in request.files:
            file = request.files[file_key]
            
            # Validar el archivo
            is_valid, validation_message = validate_file(file, file_key)
            if not is_valid:
                raise ValueError(validation_message)
            
            if file.filename:
                upload_folder = current_app.config['UPLOAD_FOLDER']
                return procesar_archivo(file, upload_folder)
        return None, None