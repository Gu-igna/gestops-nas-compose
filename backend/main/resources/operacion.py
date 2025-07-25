from flask_restful import Resource
from flask import request, send_file
from flask_jwt_extended import get_jwt_identity
import os, io
from .. import db
from sqlalchemy import or_
from dateutil.parser import parse
from main.models import OperacionModel, PersonaModel, UsuarioModel, SubcategoriaModel, CategoriaModel, ConceptoModel
from main.auth.decorators import role_required
import pandas as pd
from datetime import datetime

class Operacion(Resource):
    @role_required(roles=["admin","supervisor"])
    def get(self, id):
        """"Obtiene una operacion por su ID"""
        try:
            operacion  = db.session.query(OperacionModel).get_or_404(id)
            return operacion.to_json(), 200
        except Exception as e:
            return {'message': str(e)}, 500
        
    @role_required(roles=["admin","supervisor"])
    def delete(self, id):
        """"Elimina una operacion por su ID"""
        try:
            operacion = OperacionModel.query.get(id)
            if not operacion:
                return {'message': 'Operación no encontrada'}, 404
            
            self._eliminar_archivo_si_existe(operacion.comprobante_path)
            self._eliminar_archivo_si_existe(operacion.archivo1_path)
            self._eliminar_archivo_si_existe(operacion.archivo2_path)
            self._eliminar_archivo_si_existe(operacion.archivo3_path)
            
            db.session.delete(operacion)
            db.session.commit()
            
            return {'message': 'Operación eliminada correctamente'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al eliminar la operación', 'error': str(e)}, 500
    
    def _eliminar_archivo_si_existe(self, ruta_archivo):
        if ruta_archivo and os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)

    @role_required(roles=["admin", "supervisor"])
    def patch(self, id):
        """Actualiza una operación específica"""
        try:
            operacion = OperacionModel.query.get(id)
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

            campos_permitidos = [
                'fecha', 'tipo', 'caracter', 'naturaleza', 'id_persona', 
                'option', 'codigo', 'observaciones', 'metodo_de_pago', 
                'monto_total', 'id_subcategoria'
            ]
            
            if not request.json:
                return {'message': 'No se proporcionaron datos para actualizar'}, 400
            
            campos_actualizados = []

            if 'tipo' in request.json:
                tipo_anterior = operacion.tipo
                nuevo_tipo = request.json['tipo']

                if tipo_anterior != nuevo_tipo:
                    operacion.actualizar_tipo_operacion(nuevo_tipo)
                    campos_actualizados.append('tipo')


            for campo in campos_permitidos:
                if campo in request.json:
                    setattr(operacion, campo, request.json[campo])
                    if campo not in campos_actualizados:
                        campos_actualizados.append(campo)
            
            if not campos_actualizados:
                return {'message': 'No se proporcionaron campos válidos para actualizar'}, 400
            
            db.session.commit()
            
            return {
                'message': 'Operación actualizada correctamente',
                'id': operacion.id,
                'campos_actualizados': campos_actualizados,
                'modificado_por_otro': operacion.modificado_por_otro
            }, 200
        
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al actualizar la operación', 'error': str(e)}, 500

class Operaciones(Resource):
    @role_required(roles=["admin","supervisor"])
    def get(self):
        """Obtiene lista paginada de operaciones con opción de búsqueda"""
        try:
            page = request.args.get('page', type=int)
            per_page = request.args.get('per_page', type=int)

            query = db.session.query(OperacionModel)

            # Debug: mostrar parámetros recibidos
            print(f"Parámetros recibidos: {dict(request.args)}")

            filtros = self._generar_filtros(request.args)
            print(f"Filtros generados: {len(filtros)}")
            
            query = query.filter(*filtros) if filtros else query

            query = query.order_by(OperacionModel.fecha.desc(), OperacionModel.id.desc())

            # Si no se especifican parámetros de paginación, devolver todos los registros
            if page is None or per_page is None:
                operaciones = query.all()
                total = len(operaciones)
                
                return {
                    'operaciones': [operacion.to_json() for operacion in operaciones],
                    'total': total,           
                    'pages': 1,  
                    'page': 1,  
                }, 200
            
            # Usar paginación normal
            operaciones = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )

            return {
                'operaciones': [operacion.to_json() for operacion in operaciones.items],
                'total': operaciones.total,           
                'pages': operaciones.pages,  
                'page': operaciones.page,  
            }, 200
        except Exception as e:
            print(f"Error en get operaciones: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'message': f'Error interno del servidor: {str(e)}'}, 500

    def _procesar_filtro_fecha(self, fecha):
        """Procesa diferentes formatos de búsqueda por fecha"""
        try:
            if ':' in fecha:
                fecha_desde, fecha_hasta = fecha.split(':')
                return OperacionModel.fecha.between(
                    parse(fecha_desde).date(),
                    parse(fecha_hasta).date()
                )
            else:
                return OperacionModel.fecha.like(f"%{fecha}%")

        except ValueError:
            raise ValueError("Fecha inválida. Debe ser en formato 'YYYY-MM-DD', 'YYYY-MM', 'YYYYMM' o 'YYYY'.")

    def _generar_filtros(self, params):
        """Genera una lista de filtros en base a los parámetros de la request"""
        campos_busqueda = {
            'id': OperacionModel.id,
            'fecha': self._procesar_filtro_fecha,
            'tipo': OperacionModel.tipo,
            'naturaleza': OperacionModel.naturaleza,
            'caracter': OperacionModel.caracter,
            'persona': lambda t: OperacionModel.personas.has(or_(
                PersonaModel.cuit.like(f"%{t}%"),
                PersonaModel.razon_social.like(f"%{t}%")
            )),
            'cuit': lambda t: OperacionModel.personas.has(
                PersonaModel.cuit.like(f"%{t}%")
            ),
            'option': OperacionModel.option,
            'codigo': OperacionModel.codigo,
            'observaciones': OperacionModel.observaciones,
            'pago': OperacionModel.metodo_de_pago,
            'monto': OperacionModel._monto_total,
            'concepto': lambda t: OperacionModel.subcategoria.has(
                SubcategoriaModel.categoria.has(
                    CategoriaModel.concepto.has(
                        ConceptoModel.nombre.like(f"%{t}%")
                    )
                )
            ),
            'categoria': lambda t: OperacionModel.subcategoria.has(
                SubcategoriaModel.categoria.has(
                    CategoriaModel.nombre.like(f"%{t}%")
                )
            ),
            'subcategoria': lambda t: OperacionModel.subcategoria.has(
                SubcategoriaModel.nombre.like(f"%{t}%")
            ),
            'usuario': lambda t: OperacionModel.usuario.has(
                UsuarioModel.nombre.like(f"%{t}%")
            ),
            'global': lambda t: or_(
                OperacionModel.id.like(f"%{t}%"),
                OperacionModel.fecha.like(f"%{t}%"),
                OperacionModel.tipo.like(f"%{t}%"),
                OperacionModel.caracter.like(f"%{t}%"),
                OperacionModel.naturaleza.like(f"%{t}%"),
                OperacionModel.option.like(f"%{t}%"),
                OperacionModel.codigo.like(f"%{t}%"),
                OperacionModel.observaciones.like(f"%{t}%"),
                OperacionModel.metodo_de_pago.like(f"%{t}%"),
                OperacionModel._monto_total.like(f"%{t}%"),
                OperacionModel.personas.has(or_(
                    PersonaModel.cuit.like(f"%{t}%"),
                    PersonaModel.razon_social.like(f"%{t}%")
                )),
                OperacionModel.subcategoria.has(
                    SubcategoriaModel.nombre.like(f"%{t}%")
                ),
                OperacionModel.subcategoria.has(
                    SubcategoriaModel.categoria.has(
                        CategoriaModel.nombre.like(f"%{t}%")
                    )
                ),
                OperacionModel.subcategoria.has(
                    SubcategoriaModel.categoria.has(
                        CategoriaModel.concepto.has(
                            ConceptoModel.nombre.like(f"%{t}%")
                        )
                    )
                ),
                OperacionModel.usuario.has(
                    UsuarioModel.nombre.like(f"%{t}%")
                )
            )
        }

        filtros = []
        
        # Procesar todos los filtros (comportamiento combinado - AND)
        for campo, valor in params.items():
            # Ignorar parámetros de paginación y otros que no son filtros
            if campo in ['page', 'per_page']:
                continue
                
            if campo in campos_busqueda:
                try:
                    if campo == "fecha":
                        filtros.append(campos_busqueda["fecha"](valor))
                    elif callable(campos_busqueda[campo]):
                        filtros.append(campos_busqueda[campo](valor))
                    else:
                        filtros.append(campos_busqueda[campo].like(f"%{valor}%"))
                except Exception as e:
                    # Log el error pero continúa con otros filtros
                    print(f"Error aplicando filtro {campo}: {str(e)}")
                    continue

        return filtros


    @role_required(roles=["admin"])
    def post(self):
        """Crea una nueva operación"""
        try:
            required_fields = [
                'fecha', 'tipo', 'caracter', 'naturaleza', 'id_persona', 
                'option', 'codigo', 'metodo_de_pago', 'monto_total', 
                'id_subcategoria', 'id_usuario'
            ]
            
            if not all(field in request.json for field in required_fields):
                missing = [field for field in required_fields if field not in request.json]
                return {'message': f'Missing required fields: {", ".join(missing)}'}, 400
            
            new_operacion = OperacionModel(
                fecha=request.json.get('fecha'),
                tipo=request.json.get('tipo'),
                caracter=request.json.get('caracter'),
                naturaleza=request.json.get('naturaleza'),
                id_persona=request.json.get('id_persona'),
                comprobante_path=None,
                comprobante_tipo=None,
                option=request.json.get('option'),
                codigo=request.json.get('codigo'),
                observaciones=request.json.get('observaciones'),
                metodo_de_pago=request.json.get('metodo_de_pago'),
                monto_total=request.json.get('monto_total'),
                id_subcategoria=request.json.get('id_subcategoria'),
                id_usuario=request.json.get('id_usuario'),
                archivo1_path=None,
                archivo1_tipo=None,
                archivo2_path=None,
                archivo2_tipo=None,
                archivo3_path=None,
                archivo3_tipo=None
            )
            
            db.session.add(new_operacion)
            db.session.commit()
            
            return new_operacion.to_json(), 201
        
        except ValueError as ve:
            return {'message': str(ve)}, 400
        
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al crear la operacion', 'error': str(e)}, 500
        
class OperacionesBulk(Resource):
    @role_required(roles=["admin", "supervisor"])
    def patch(self):
        """Actualiza múltiples operaciones en una sola solicitud"""
        try:
            if not request.json or not isinstance(request.json, list):
                return {'message': 'Se esperaba una lista de operaciones para actualizar'}, 400
            
            usuario_actual_id = get_jwt_identity()
            
            operaciones_actualizadas = []
            operaciones_no_encontradas = []
            operaciones_sin_permiso = []
            
            for operacion_data in request.json:
                if 'id' not in operacion_data:
                    return {'message': 'Cada operación debe contener un campo "id"'}, 400
                
                operacion = OperacionModel.query.get(operacion_data['id'])
                if not operacion:
                    operaciones_no_encontradas.append(operacion_data['id'])
                    continue
                
                usuario_actual = UsuarioModel.query.get(usuario_actual_id)

                es_creador = int(operacion.id_usuario) == int(usuario_actual_id)
                es_supervisor = "supervisor" == str(usuario_actual.rol)
                
                if not (es_creador or es_supervisor):
                    operaciones_sin_permiso.append(operacion_data['id'])
                    continue
                
                if es_supervisor and not es_creador:
                    operacion.modificado_por_otro = True

                if es_creador and not es_supervisor:
                    operacion.modificado_por_otro = False

                campos_actualizados = []
                
                if 'tipo' in operacion_data:
                    tipo_anterior = operacion.tipo
                    nuevo_tipo = operacion_data['tipo']
                    if tipo_anterior != nuevo_tipo:
                        operacion.actualizar_tipo_operacion(nuevo_tipo)
                        campos_actualizados.append('tipo')

                campos_permitidos = [
                    'fecha', 'tipo', 'caracter', 'naturaleza', 'id_persona', 
                    'option', 'codigo', 'observaciones', 'metodo_de_pago', 
                    'monto_total', 'id_subcategoria'
                ]
                
                for campo in campos_permitidos:
                    if campo in operacion_data:
                        setattr(operacion, campo, operacion_data[campo])
                        if campo not in campos_actualizados:
                            campos_actualizados.append(campo)
                
                if campos_actualizados:
                    operaciones_actualizadas.append({
                        'id': operacion.id,
                        'campos_actualizados': campos_actualizados
                    })
            
            if operaciones_actualizadas:
                db.session.commit()
            
            resultado = {
                'message': f'Se actualizaron {len(operaciones_actualizadas)} operaciones',
                'operaciones_actualizadas': operaciones_actualizadas
            }
            
            if operaciones_no_encontradas:
                resultado['operaciones_no_encontradas'] = operaciones_no_encontradas
            
            if operaciones_sin_permiso:
                resultado['operaciones_sin_permiso'] = operaciones_sin_permiso
            
            return resultado, 200
        
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al actualizar operaciones', 'error': str(e)}, 500

class OperacionesExcel(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self):
        """Genera y descarga un archivo Excel con las operaciones filtradas"""
        try:
            filtros = Operaciones()._generar_filtros(request.args)
            query = db.session.query(OperacionModel)
            query = query.filter(*filtros) if filtros else query
            
            # Ordenar por Fecha descendente (más reciente primero)
            query = query.order_by(OperacionModel.fecha.desc(), OperacionModel.id.desc())
            
            operaciones = query.all()
            
            data = [op.to_excel() for op in operaciones]
            df = pd.DataFrame(data)

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name='Operaciones', index=False)
            
            output.seek(0)

            return send_file(
                output, 
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f'operaciones_{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.xlsx'
            )
            
        except Exception as e:
            return {'message': f'Error al generar Excel: {str(e)}'}, 500

class OperacionesTotales(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self):
        """Calcula totales de operaciones aplicando los mismos filtros que el endpoint principal"""
        try:
            query = db.session.query(OperacionModel)

            # Aplicar los mismos filtros que el endpoint principal
            filtros = Operaciones()._generar_filtros(request.args)
            query = query.filter(*filtros) if filtros else query

            # Obtener todas las operaciones que coinciden con los filtros
            operaciones = query.all()

            # Calcular totales
            total_ingresos = 0
            total_egresos = 0
            
            for operacion in operaciones:
                monto = float(operacion.monto_total) if operacion.monto_total else 0
                
                if operacion.tipo == 'ingreso':
                    total_ingresos += monto
                elif operacion.tipo == 'egreso':
                    total_egresos += abs(monto)  # Asegurar que egresos son positivos
            
            total_general = total_ingresos - total_egresos
            
            return {
                'total_general': total_general,
                'total_ingresos': total_ingresos,
                'total_egresos': total_egresos,
                'cantidad_operaciones': len(operaciones)
            }, 200
            
        except Exception as e:
            return {'message': f'Error al calcular totales: {str(e)}'}, 500