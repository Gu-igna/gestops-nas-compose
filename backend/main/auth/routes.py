from flask import request, jsonify, Blueprint
from .. import db
from main.models import UsuarioModel
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, decode_token
from main.auth.decorators import role_required
from main.mail.functions import sendMail
from datetime import timedelta
import secrets
import os

auth = Blueprint('auth', __name__, url_prefix='/auth')

@auth.route('/login', methods=['POST']) 
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email y contraseña son obligatorios"}), 400

    usuario = db.session.query(UsuarioModel).filter_by(email=data["email"]).first_or_404(description="El usuario no existe")

    if usuario.validate_pass(data.get("password")):
        access_token = create_access_token(identity=usuario)
        return jsonify({"access_token": access_token, "usuario": usuario.to_json_short()}), 200
    else:
        return jsonify({"error": "Contraseña incorrecta"}), 401

@auth.route('/register', methods=['POST'])
@role_required(roles=["admin", "supervisor"])
def register():
    data = request.get_json()

    required_fields = ['nombre', 'apellido', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Faltan campos obligatorios"}), 400

    usuario = UsuarioModel.from_json(data)

    if db.session.query(UsuarioModel.id).filter(UsuarioModel.email == usuario.email).scalar():
        return jsonify({"error": "Email duplicado"}), 409

    try:
        new_password = secrets.token_urlsafe(10)
        usuario.plain_password = new_password

        db.session.add(usuario)
        db.session.commit()

        frontend_url = os.getenv('FRONTEND_URL')
        sendMail([usuario.email], "Bienvenido!", 'register', new_password=new_password, usuario=usuario, frontend_url=frontend_url)

    except Exception as error:
        db.session.rollback()
        return jsonify({"error": "Error al registrar el usuario"}), 500

    return usuario.to_json(), 201

@auth.route('/reset-password', methods=['POST'])
def forgot_password():
    """
    Genera un token de un solo uso para restablecer la contraseña.
    """
    email = request.get_json().get("email")
    if not email:
        return jsonify({'error': 'El email es obligatorio'}), 400

    try:
        usuario = db.session.query(UsuarioModel).filter_by(email=email).first()
            
        if not usuario or not usuario.password:
            return jsonify({'message': '...'}), 200

        # Crear token con el hash de la contraseña como sello de un solo uso
        # El token será inválido tan pronto como la contraseña cambie
        password_hash_part = usuario.password[:20]  # Usamos más caracteres para mayor seguridad
        additional_claims = {
            "password_hash_part": password_hash_part,
            "purpose": "password_reset"
        }
        reset_token = create_access_token(identity=usuario, additional_claims=additional_claims)

        frontend_url = os.getenv('FRONTEND_URL')
        sendMail([email], 'Restablecer Contraseña', 'resetpassword', reset_token=reset_token, usuario=usuario, frontend_url=frontend_url)

        return jsonify({'message': '...'}), 200
        
    except Exception as error:
        print(f"Error en forgot_password: {error}")
        return jsonify({'error': 'Ocurrió un error al procesar la solicitud'}), 500


@auth.route('/update-password', methods=['POST'])
def update_password():
    """
    Actualiza la contraseña usando token de reset O autenticación normal.
    """
    data = request.get_json()
    reset_token = data.get("reset_token")
    current_password = data.get("current_password") 
    new_password = data.get("new_password")

    if not new_password:
        return jsonify({'error': 'La nueva contraseña es obligatoria'}), 400

    try:
        # CASO 1: Reset con token (usuario olvidó contraseña)
        if reset_token:
            decoded_token = decode_token(reset_token)
            
            user_id = decoded_token['sub']
            password_hash_part_from_token = decoded_token['password_hash_part']
            purpose = decoded_token.get('purpose')

            # Validar que sea un token de reset de contraseña
            if purpose != "password_reset":
                return jsonify({'error': 'Token inválido'}), 400

            usuario = db.session.query(UsuarioModel).get(user_id)

            if not usuario:
                return jsonify({'error': 'Usuario no encontrado'}), 400

            # Validar que el token coincida con el hash actual (un solo uso)
            current_password_hash_part = usuario.password[:20]
            if current_password_hash_part != password_hash_part_from_token:
                return jsonify({'error': 'Token inválido o ya utilizado'}), 400

            # Actualizar contraseña (esto automáticamente invalida el token)
            usuario.plain_password = new_password
            db.session.commit()

            return jsonify({'message': 'Contraseña actualizada correctamente'}), 200

        # CASO 2: Usuario logueado quiere cambiar contraseña
        else:
            if not current_password:
                return jsonify({'error': 'La contraseña actual es requerida'}), 400
                
            # Obtener usuario del token JWT del header Authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Token de autorización requerido'}), 401
                
            token = auth_header.split(' ')[1]
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            usuario = db.session.query(UsuarioModel).get(user_id)
            if not usuario:
                return jsonify({'error': 'Usuario no encontrado'}), 400
                
            # Verificar que la contraseña actual sea correcta
            if not usuario.validate_pass(current_password):
                return jsonify({'error': 'La contraseña actual es incorrecta'}), 400
                
            # Actualizar contraseña
            usuario.plain_password = new_password
            db.session.commit()

            return jsonify({'message': 'Contraseña actualizada correctamente'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al actualizar la contraseña: {e}")
        return jsonify({'error': 'Token inválido, expirado o error interno'}), 500