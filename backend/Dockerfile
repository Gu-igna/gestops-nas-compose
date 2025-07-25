# Usa una imagen base de Python ligera
FROM python:3.12-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de requisitos e instala las dependencias
# Esto se hace primero para aprovechar el cache de Docker si requirements.txt no cambia
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el resto de tu código fuente de Flask al directorio de trabajo
# 'COPY .' aquí copiará todo el contenido de la carpeta 'backend' al '/app' del contenedor
COPY . .

# Comando para iniciar la aplicación Flask con Gunicorn
# Asume que tu aplicación Flask se inicializa como 'app' en 'app.py'
# dentro del directorio raíz del backend (que ahora es /app en el contenedor)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]