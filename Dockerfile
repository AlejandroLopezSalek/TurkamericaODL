FROM node:18-alpine

# Definir directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Construir el sitio estático (Eleventy)
# Nota: Si Eleventy necesita devDependencies, podrías necesitar instalar todo y luego podar
# En este caso asumimos que podemos construir con lo que hay o ajustaremos el proceso
RUN npm install
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Usar PM2-runtime para producción en Docker
RUN npm install pm2 -g

# Comando de inicio usando el archivo ecosystem
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
