# Guía de Instalación TurkAmerica VM

Lista de dependencias y comandos necesarios para poner a punto una VM desde cero.

## 1. Node.js & NPM
Recomendado usar NVM (Node Version Manager):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Recargar shell y luego:
nvm install 20
```

## 2. Bases de Datos

### MongoDB (Base de datos principal)
```bash
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### Redis (Caché - Requerido para AI)
```bash
sudo apt update && sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Qdrant (Base de datos vectorial para RAG)
Recomendado usar Docker:
```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

## 3. Utilidades Globales

### PM2 (Gestor de Procesos)
```bash
npm install -g pm2
```

### Nginx (Proxy Inverso)
```bash
sudo apt update && sudo apt install nginx -y
```

### Certbot (SSL)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

## 4. Configuración de Carpeta
```bash
sudo mkdir -p /var/www/turkamerica
sudo chown -R $USER:$USER /var/www/turkamerica
```

## 5. Monitorización y Salud del Sistema

Comandos esenciales para verificar que todo funcione correctamente:

### Servidor de Aplicación (PM2)
```bash
pm2 status        # Ver estado de los procesos
pm2 monit         # Monitor interactivo (CPU/RAM en tiempo real)
pm2 logs          # Ver logs combinados
pm2 list          # Lista simple de apps
```

### Bases de Datos
```bash
# MongoDB
mongosh --eval "db.adminCommand('ping')"
sudo systemctl status mongod

# Redis
redis-cli ping    # Debe responder PONG
sudo systemctl status redis-server

# Qdrant (Base Vectorial)
curl http://localhost:6333/dashboard  # Verificar dashboard
```

### Recursos del Sistema (VM)
```bash
free -h           # Ver memoria RAM disponible (crítico para 2GB RAM)
htop              # Ver procesos y uso de CPU
df -h             # Ver espacio en disco
uptime            # Ver tiempo de encendido y carga media
```

### Salud de la API
```bash
curl http://localhost:3000/health  # Verificar endpoint de salud de TurkAmerica
```
