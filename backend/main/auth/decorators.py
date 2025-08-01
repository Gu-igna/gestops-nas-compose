from .. import jwt
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from functools import wraps

def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                if claims['rol'] in roles:
                    return fn(*args, **kwargs)
                else:
                    return {"message": "Rol sin permisos de acceso al recurso"}, 403
            except Exception as e:
                # Manejar errores JWT específicos
                error_message = str(e)
                
                if "expired" in error_message.lower() or "signature has expired" in error_message.lower():
                    return {"error": "Token expirado", "code": "TOKEN_EXPIRED"}, 401
                elif "invalid" in error_message.lower() or "decode" in error_message.lower():
                    return {"error": "Token inválido", "code": "INVALID_TOKEN"}, 401
                else:
                    return {"error": "Token de autorización requerido", "code": "MISSING_TOKEN"}, 401
        return wrapper
    return decorator

@jwt.user_identity_loader
def user_identity_lookup(usuario):
    return str(usuario.id)

@jwt.additional_claims_loader
def add_claims_to_access_token(usuario):
    claims = {
        'rol': usuario.rol, 
        'id': usuario.id,
        'email': usuario.email
    }
    return claims

# Manejadores de errores JWT - Se registran automáticamente
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {"error": "Token expirado", "code": "TOKEN_EXPIRED"}, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {"error": "Token inválido", "code": "INVALID_TOKEN"}, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return {"error": "Token de autorización requerido", "code": "MISSING_TOKEN"}, 401