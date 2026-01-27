import os
from flask import Flask
from dotenv import load_dotenv
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS

api = Api()
db = SQLAlchemy()
jwt = JWTManager()
mailsender = Mail()

def configure_cors(app):
    """
    Configuración CORS segura y restrictiva
    Solo permite acceso desde el frontend Angular y durante desarrollo
    """
    # Obtener URLs permitidas desde variables de entorno
    frontend_url = os.getenv('FRONTEND_URL')
    environment = os.getenv('ENVIRONMENT')
    
    # Lista de orígenes permitidos
    allowed_origins = []
    
    if environment == 'development':
        # En desarrollo: permitir localhost en diferentes puertos
        allowed_origins = [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            '/api',
        ]
    elif environment == 'production':
        if frontend_url:
            allowed_origins = [
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://192.168.1.111:8080'
        ]
        docker_frontend = os.getenv('DOCKER_FRONTEND_URL')
        if docker_frontend:
            allowed_origins.append(docker_frontend)
    
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
         allow_headers=[
             'Content-Type',
             'Authorization',
             'Access-Control-Allow-Credentials'
         ],
         supports_credentials=True,
         max_age=3600
    )
    
    app.logger.info(f"CORS configurado para: {allowed_origins}")

def create_app():
    app = Flask(__name__)
    
    load_dotenv()


    # Configuración CORS segura y restrictiva
    configure_cors(app)

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Database configuration URL para MariaDB
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_port = os.getenv('DB_PORT')
    db_name = os.getenv('DB_NAME')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')

    db.init_app(app)
    
    # Import resources directory
    import main.resources as resources

    api.add_resource(resources.UsuariosResource,"/api/usuarios")
    api.add_resource(resources.UsuarioResource, "/api/usuario/<int:id>")
    api.add_resource(resources.OperacionesResource,"/api/operaciones")
    api.add_resource(resources.OperacionResource, "/api/operacion/<int:id>")
    api.add_resource(resources.OperacionesBulkResource, "/api/operaciones/bulk")
    api.add_resource(resources.OperacionesTotalesResource, "/api/operaciones/totales")
    api.add_resource(resources.ArchivosOperacionesResource, "/api/operaciones/<int:id_operacion>/archivos")
    api.add_resource(resources.ArchivoOperacionResource, "/api/operacion/<int:id_operacion>/archivo/<string:campo_archivo>")
    api.add_resource(resources.OperacionesExcelResource, "/api/operaciones/excel")
    api.add_resource(resources.ConceptosResource,"/api/conceptos")
    api.add_resource(resources.ConceptoResource, "/api/concepto/<int:id>")
    api.add_resource(resources.CategoriasResource,"/api/categorias")
    api.add_resource(resources.CategoriaResource, "/api/categoria/<int:id>")
    api.add_resource(resources.SubcategoriasResource,"/api/subcategorias")
    api.add_resource(resources.SubcategoriaResource, "/api/subcategoria/<int:id>")
    api.add_resource(resources.PersonasResource,"/api/personas")
    api.add_resource(resources.PersonaResource, "/api/persona/<int:id>")

    api.init_app(app)
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES'))
    jwt.init_app(app)

    # Registration of authentication routes
    from main.auth import routes
    app.register_blueprint(routes.auth)

    # Flask-Mail configuration for email sending
    app.config['MAIL_HOSTNAME'] = os.getenv('MAIL_HOSTNAME')
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = os.getenv('MAIL_PORT')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS')
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['FLASKY_MAIL_SENDER'] = os.getenv('FLASKY_MAIL_SENDER')
    mailsender.init_app(app)

    return app
