from flask_restful import Resource
from flask import request
from .. import db
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from main.models import PersonaModel
from main.auth.decorators import role_required
import re

class Persona(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self, id):
        """Obtiene una persona por su ID"""
        try:
            persona  = db.session.query(PersonaModel).get_or_404(id)
            return persona.to_json(), 200
        except Exception as e:
            return {'message': str(e)}, 500

    @role_required(roles=["admin", "supervisor"])
    def delete(self, id):
        """Elimina una persona por su ID"""
        try:
            persona  = db.session.query(PersonaModel).get_or_404(id)
            db.session.delete(persona)
            db.session.commit()
            return {'message': 'Persona eliminada'}, 204
        except Exception as e:
            db.session.rollback()
            return {'message': f'Error al eliminar persona: {str(e)}'}, 500

    @role_required(roles=["admin", "supervisor"])
    def put(self, id):
        """Actualiza una persona por su ID"""
        try:
            persona = db.session.query(PersonaModel).get_or_404(id)
            data = request.get_json()

            if not data:
                return {'message': 'No se recibieron datos para actualizar'}, 400

            if 'cuit' in data and data['cuit'] != persona.cuit:
                if db.session.query(PersonaModel).filter(PersonaModel.cuit == data['cuit'], PersonaModel.id != id).first():
                    return {'message': f'El CUIT {data["cuit"]} ya está registrado para otra persona.'}, 400

            for key, value in data.items():
                setattr(persona, key, value)

            db.session.add(persona)
            db.session.commit()
            return persona.to_json(), 200
        except ValueError as ve:
            db.session.rollback()
            return {'message': str(ve)}, 400
        except IntegrityError:
            db.session.rollback()
            return {'message': 'Error de integridad de datos: El CUIT ya existe o hay otro problema de unicidad.'}, 409
        except Exception as e:
            db.session.rollback()
            return {'message': f'Error al actualizar persona: {str(e)}'}, 500

class Personas(Resource):
    @role_required(roles=["admin", "supervisor"])
    def get(self):
        """Obtiene lista paginada de personas con opción de búsqueda"""
        try:
            page = request.args.get('page', default=1, type=int)
            per_page = request.args.get('per_page', default=10, type=int)

            query = db.session.query(PersonaModel)

            query = self._aplicar_busqueda_general(query)

            if (page == 0 and per_page == 0):
                personas = query.all()
                return {
                'personas': [persona.to_json() for persona in personas],
                'total': len(personas),
                'pages': 1,
                'page': 1,
                }, 200
            else:
                personas = query.paginate(
                    page=page, 
                    per_page=per_page, 
                    error_out=False, 
                )
                return {
                    'personas': [persona.to_json() for persona in personas.items],
                    'total': personas.total,
                    'pages': personas.pages,
                    'page': personas.page,
                }, 200
        except Exception as e:
            return {'message': str(e)}, 500

    def _aplicar_busqueda_general(self, query):
        """Aplica filtros de búsqueda al query."""
        search = request.args.get('busqueda')

        if search:
            conditions = [
                PersonaModel.id.ilike(f'%{search}%'),
                PersonaModel.cuit.ilike(f'%{search}%'),
                PersonaModel.razon_social.ilike(f'%{search}%'),
            ]

            return query.filter(or_(*conditions))
        return query


    @role_required(roles=["admin", "supervisor"])
    def post(self):
        """Crea una nueva persona"""
        data = request.get_json()
        if not data:
            return {'message': 'No se recibieron datos'}, 400

        cuit = data.get('cuit')
        razon_social = data.get('razon_social')

        if not cuit or not razon_social:
            return {'message': 'Faltan datos obligatorios (CUIT o Razón Social)'}, 400
        
        if db.session.query(PersonaModel).filter_by(cuit=cuit).first():
            return {'message': f'El CUIT {cuit} ya está registrado.'}, 409

        try:
            new_persona = PersonaModel.from_json(data)
            db.session.add(new_persona)
            db.session.commit()
            return new_persona.to_json(), 201
        except Exception as ve:
            db.session.rollback()
            return {'message': str(ve)}, 400
        except Exception as e:
            db.session.rollback()
            return {'message': f'Error al crear persona: {str(e)}'}, 500