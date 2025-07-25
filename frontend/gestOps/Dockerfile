# --- ETAPA DE CONSTRUCCIÓN (Build Stage) ---
# Usamos una imagen base de Node.js (versión 24-alpine es ligera y eficiente)
# para compilar tu aplicación Angular. Le damos el nombre 'build-stage' a esta etapa.
FROM node:24-alpine AS build-stage

# Establecemos el directorio de trabajo dentro del contenedor Docker.
# Todos los comandos siguientes se ejecutarán desde /app.
WORKDIR /app

# Copiamos solo los archivos de configuración de dependencias (package.json y package-lock.json)
# Esto es una optimización importante: si estos archivos no cambian, Docker puede usar un caché,
# lo que acelera las futuras construcciones.
COPY package.json package-lock.json ./

# Instalamos todas las dependencias de Node.js listadas en package.json.
# ¡IMPORTANTE! Añadimos --legacy-peer-deps para solucionar el error de dependencias.
RUN npm install --legacy-peer-deps

# Copiamos todo el resto de tu código fuente de Angular (tu carpeta 'src', 'angular.json', etc.)
# al directorio de trabajo dentro del contenedor.
COPY . .

# Compilamos tu aplicación Angular para producción.
# El nombre de la carpeta de salida 'gest-ops' debe coincidir con lo que tienes configurado en tu angular.json.
# Si tu aplicación se compila en una carpeta diferente, ajústalo aquí.
RUN npm run build

# --- ETAPA DE SERVIDO (Serve Stage) ---
# Usamos una imagen ligera de Nginx (nginx:alpine) para servir los archivos estáticos.
# Esta etapa es más pequeña y segura porque no incluye Node.js ni herramientas de desarrollo.
FROM nginx:alpine

# Copiamos los archivos estáticos de tu aplicación Angular compilada
# desde la etapa de construcción ('build-stage') a la ubicación de Nginx.
# '/app/dist/gest-ops/browser' es la ruta donde 'npm run build' colocó los archivos en la etapa anterior.
COPY --from=build-stage /app/dist/gest-ops/browser /usr/share/nginx/html

# Copiamos tu archivo de configuración personalizado de Nginx.
# Asegúrate de que este archivo (nginx.conf) esté en la misma carpeta que este Dockerfile.
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN ls -l /etc/nginx/conf.d/ /usr/share/nginx/html/ && cat /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 del contenedor Nginx.
# Este es el puerto interno en el que Nginx escuchará el tráfico.
EXPOSE 80

# Comando final para iniciar Nginx en primer plano cuando el contenedor se inicia.
CMD ["nginx", "-g", "daemon off;"]
