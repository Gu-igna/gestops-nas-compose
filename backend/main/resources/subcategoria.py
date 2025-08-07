from flask_restful import Resource
from flask import request
from .. import db
from sqlalchemy import or_
from main.models import SubcategoriaModel
from main.auth.decorators import role_required

class Subcategoria(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self, id):
        """Obtiene una subcategoria por su ID"""
        try:
            subcategoria  = db.session.query(SubcategoriaModel).get_or_404(id)
            return subcategoria.to_json(), 200
        except Exception as e:
            return {'message': str(e)}, 500

    @role_required(roles=["admin", "supervisor"])
    def delete(self, id):
        """Elimina una subcategoria por su ID"""
        try:
            subcategoria  = db.session.query(SubcategoriaModel).get_or_404(id)
            db.session.delete(subcategoria)
            db.session.commit()
            return {'message': 'Subcategoria eliminada'}, 204
        except Exception as e:
            db.session.rollback()
            return {'message': f'Error al eliminar subcategoria: {str(e)}'}, 500
    
    @role_required(roles=["admin", "supervisor"])
    def put(self, id):
        """Actualiza una subcategoria por su ID"""
        try:
            subcategoria = db.session.query(SubcategoriaModel).get_or_404(id)
            data = request.get_json()

            for key, value in data.items():
                setattr(subcategoria, key, value)

            db.session.add(subcategoria)
            db.session.commit()
            return subcategoria.to_json(), 200
        except Exception as e:
            db.session.rollback()
            return {'message': f'Error al actualizar subcategoria: {str(e)}'}, 500
    
class Subcategorias(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self):
        """Obtiene lista paginada de subcategorias con opción de búsqueda y filtros combinados"""
        try:
            page = request.args.get('page', type=int)
            per_page = request.args.get('per_page', type=int)

            query = db.session.query(SubcategoriaModel)

            filtros = self._generar_filtros(request.args)
            if filtros:
                query = query.filter(*filtros)

            # Búsqueda general (parámetro 'busqueda')
            busqueda = request.args.get('busqueda')
            if busqueda:
                query = self._aplicar_busqueda_general(query)

            # Si no se especifican parámetros de paginación, devolver todos los registros
            if page is None or per_page is None or (page == 0 and per_page == 0):
                subcategorias = query.all()
                return {
                    'subcategorias': [subcategoria.to_json() for subcategoria in subcategorias],
                    'total': len(subcategorias),
                    'pages': 1,
                    'page': 1,
                }, 200
            else:
                subcategorias = query.paginate(
                    page=page,
                    per_page=per_page,
                    error_out=False
                )
                return {
                    'subcategorias': [subcategoria.to_json() for subcategoria in subcategorias.items],
                    'total': subcategorias.total,
                    'pages': subcategorias.pages,
                    'page': subcategorias.page,
                }, 200
        except Exception as e:
            return {'message': str(e)}, 500

    def _generar_filtros(self, params):
        """Genera una lista de filtros combinados en base a los parámetros de la request"""
        from main.models import CategoriaModel, ConceptoModel

        campos_busqueda = {
            'id': lambda t: SubcategoriaModel.id == int(t),
            'nombre': lambda t: SubcategoriaModel.nombre.ilike(f"%{t}%"),
            'categoria': lambda t: SubcategoriaModel.categoria.has(
                CategoriaModel.nombre.ilike(f"%{t}%")
            ),
            'concepto': lambda t: SubcategoriaModel.categoria.has(
                CategoriaModel.concepto.has(
                    ConceptoModel.nombre.ilike(f"%{t}%")
                )
            ),
            'subcategoria': lambda t: SubcategoriaModel.nombre.ilike(f"%{t}%"),
        }

        filtros = []
        # Procesar todos los filtros (combinados con AND)
        for campo, valor in params.items():
            if campo in ['page', 'per_page', 'busqueda']:
                continue
            if campo in campos_busqueda and valor:
                try:
                    filtros.append(campos_busqueda[campo](valor))
                except Exception as e:
                    continue
        return filtros

    def _aplicar_busqueda_general(self, query):
        """Aplica búsqueda global sobre varios campos."""
        search = request.args.get('busqueda')
        if search:
            from main.models import CategoriaModel, ConceptoModel
            subquery = db.session.query(CategoriaModel.id).filter(
                CategoriaModel.id_concepto.in_(
                    db.session.query(ConceptoModel.id).filter(
                        ConceptoModel.nombre.ilike(f'%{search}%')
                    )
                )
            )
            conditions = [
                SubcategoriaModel.id.like(f'%{search}%'),
                SubcategoriaModel.nombre.ilike(f'%{search}%'),
                SubcategoriaModel.categoria.has(CategoriaModel.nombre.ilike(f'%{search}%')),
                SubcategoriaModel.id_categoria.in_(subquery)
            ]
            query = query.filter(or_(*conditions))
        return query

    @role_required(roles=["admin", "supervisor"])
    def post(self):
        """Crea una nueva subcategoria"""
        try:
            data = request.get_json()
            if not data:
                return {'message': 'No se recibieron datos'}, 400
            
            if 'nombre' not in data:
                return {'message': 'Falta el nombre de la categoria'}, 400
            
            if 'id_categoria' not in data:
                return {'message': 'Falta el ID del categoria'}, 400
            
            new_subcategoria = SubcategoriaModel.from_json(data)
            db.session.add(new_subcategoria)
            db.session.commit()

            return new_subcategoria.to_json(), 201
        
        except ValueError as ve:
            return {'message': str(ve)}, 400
        
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error al crear la subcategoria', 'error': str(e)}, 500