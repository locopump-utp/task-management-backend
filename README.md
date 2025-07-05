# 📋 Task Management Backend API

Un sistema completo de gestión de tareas y proyectos construido con **Node.js**, **TypeScript**, **Express**, y **MongoDB**.

## 🚀 Características Principales

- ✅ **Gestión de Usuarios** (Registro/Login/Perfil)
- ✅ **CRUD de Proyectos** (Crear, Leer, Actualizar, Eliminar)
- ✅ **CRUD de Tareas** (Las tareas pertenecen a proyectos)
- ✅ **Gestión de Equipos** (Asignar usuarios a proyectos)
- ✅ **Dashboard** (Estadísticas y vista general)
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Autorización basada en roles** (admin/user)
- ✅ **API RESTful** documentada
- ✅ **Validación de datos** con Zod
- ✅ **Manejo de errores** centralizado
- ✅ **Rate limiting** y seguridad
- ✅ **Docker** y Docker Compose

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 22.16.0
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de Datos**: MongoDB 7.0
- **ODM**: Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Zod
- **Seguridad**: bcryptjs, helmet, cors
- **Contenedores**: Docker & Docker Compose

## 📁 Estructura del Proyecto

```
src/
├── app.ts                 # Configuración principal de Express
├── server.ts              # Punto de entrada del servidor
├── config/                # Configuraciones (DB, CORS, ENV)
├── controllers/           # Controladores de rutas
├── database/             
│   ├── entities/          # Modelos de MongoDB/Mongoose
│   ├── migrations/        # Scripts de migración
│   └── seeders/           # Datos de prueba
├── middleware/            # Middleware personalizado
├── repositories/          # Capa de acceso a datos
├── routes/v1/             # Definición de rutas API v1
├── services/              # Lógica de negocio
├── types/                 # Tipos TypeScript y esquemas Zod
└── utils/                 # Utilidades y helpers
```

## 🚀 Inicio Rápido con Docker

### Prerrequisitos
- Docker
- Docker Compose

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd task-management-backend
```

### 2. Ejecutar con Docker Compose
```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O ejecutar en segundo plano
docker-compose up -d
```

### 3. Acceder a los servicios
- **API Backend**: http://localhost:4002
- **MongoDB**: localhost:27017
- **Mongo Express** (Admin UI): http://localhost:8081
  - Usuario: `admin` / Contraseña: `admin123`

## 💻 Desarrollo Local

### Prerrequisitos
- Node.js 22.16.0
- MongoDB 7.0+
- npm o yarn

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu entorno
nano .env
```

### 3. Ejecutar MongoDB localmente
```bash
# Con Docker (recomendado)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# O instalar MongoDB localmente
```

### 4. Ejecutar migraciones y seeders
```bash
# Ejecutar migraciones
npm run migrate

# Sembrar datos de prueba
npm run seed
```

### 5. Iniciar el servidor de desarrollo
```bash
# Desarrollo con hot-reload
npm run dev

# O modo normal
npm start
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con hot-reload
npm run dev:watch    # Servidor con nodemon

# Construcción
npm run build        # Compilar TypeScript
npm start           # Ejecutar versión compilada

# Base de datos
npm run migrate     # Ejecutar migraciones
npm run seed        # Sembrar datos de prueba

# Calidad de código
npm run lint        # Ejecutar ESLint
npm run lint:fix    # Corregir errores de ESLint
npm run format      # Formatear código con Prettier
```

## 🐳 Comandos Docker

```bash
# Desarrollo
docker-compose up --build     # Construir y levantar servicios
docker-compose up -d          # Ejecutar en segundo plano
docker-compose down           # Detener y eliminar contenedores
docker-compose logs app       # Ver logs del backend
docker-compose logs mongodb   # Ver logs de MongoDB

# Ejecutar comandos dentro del contenedor
docker-compose exec app npm run migrate   # Ejecutar migraciones
docker-compose exec app npm run seed      # Ejecutar seeders
docker-compose exec app npm run dev       # Desarrollo con hot-reload

# Reiniciar servicios
docker-compose restart app    # Reiniciar solo el backend
docker-compose restart       # Reiniciar todos los servicios
```

## 📋 Guía de Inicio Paso a Paso

### 🐳 Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio:**
```bash
git clone https://github.com/locopump-utp/task-management-backend.git
cd task-management-backend
```

2. **Verificar que Docker esté funcionando:**
```bash
docker --version
docker-compose --version
```

3. **Crear archivo de variables de entorno:**
```bash
# Crear archivo .env (ya está configurado para Docker)
cp .env.example .env
```

4. **Levantar todos los servicios:**
```bash
# Construir imágenes y levantar servicios
docker-compose up --build

# Si quieres ejecutar en segundo plano:
docker-compose up -d --build
```

5. **Ejecutar migraciones (en otra terminal):**
```bash
# Esperar que los servicios estén corriendo, luego:
docker-compose exec app npm run migrate
```

6. **Ejecutar seeders (datos de prueba):**
```bash
docker-compose exec app npm run seed
```

7. **Verificar que todo funciona:**
- API: http://localhost:4002
- Mongo Express: http://localhost:8081 (admin/admin123)
- Health check: http://localhost:4002/api/v1/health

### 💻 Opción 2: Desarrollo Local

1. **Prerrequisitos:**
```bash
# Verificar Node.js
node --version  # Debe ser 22.16.0

# Instalar MongoDB
# Ubuntu/Debian:
sudo apt install mongodb

# macOS:
brew install mongodb-community

# O usar Docker para MongoDB solamente:
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

2. **Configurar el proyecto:**
```bash
# Clonar e instalar dependencias
git clone https://github.com/locopump-utp/task-management-backend.git
cd task-management-backend
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tu configuración local
nano .env
```

4. **Ejecutar migraciones y seeders:**
```bash
npm run migrate
npm run seed
```

5. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

## 🗄️ Base de Datos

### Migraciones

Las migraciones crean las colecciones y configuran índices:

```bash
# Con Docker
docker-compose exec app npm run migrate

# Local
npm run migrate
```

**Migraciones disponibles:**
- `001_CreateUsersCollection.ts` - Colección de usuarios
- `002_CreateProjectsCollection.ts` - Colección de proyectos  
- `003_CreateTasksCollection.ts` - Colección de tareas

### Seeders

Los seeders insertan datos de prueba:

```bash
# Con Docker
docker-compose exec app npm run seed

# Local
npm run seed
```

**Datos que se crean:**
- Usuario administrador: `admin@example.com` / `password123`
- Usuario normal: `user@example.com` / `password123`
- 3 proyectos de ejemplo
- 10 tareas de ejemplo

## 🔍 Verificación del Proyecto

### 1. Healthcheck
```bash
curl http://localhost:4002/api/v1/health
# Respuesta esperada: {"status": "OK", "timestamp": "..."}
```

### 2. Login de prueba
```bash
curl -X POST http://localhost:4002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

### 3. Ver proyectos
```bash
# Usar el token del login anterior
curl http://localhost:4002/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛠️ Solución de Problemas

### Problemas Comunes

**1. Puerto 4002 ocupado:**
```bash
# Ver qué proceso usa el puerto
lsof -i :4002

# Cambiar puerto en docker-compose.yml o .env
```

**2. MongoDB no conecta:**
```bash
# Verificar que MongoDB esté corriendo
docker-compose logs mongodb

# Reiniciar servicios
docker-compose restart
```

**3. Migraciones fallan:**
```bash
# Limpiar base de datos y volver a intentar
docker-compose exec mongodb mongosh
> use task_management
> db.dropDatabase()
> exit

# Volver a ejecutar migraciones
docker-compose exec app npm run migrate
```

**4. Permisos en Linux:**
```bash
# Si hay problemas de permisos con Docker
sudo chown -R $USER:$USER .
```

### Logs útiles

```bash
# Ver logs del backend
docker-compose logs -f app

# Ver logs de MongoDB
docker-compose logs -f mongodb

# Ver logs de todos los servicios
docker-compose logs -f
```

## 🚀 Deployment

### Variables de Entorno Producción

```env
NODE_ENV=production
PORT=4002
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### Build de Producción

```bash
# Construir imagen de producción
docker build -t task-management-backend .

# O usar Docker Compose para producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

Una vez que el servidor esté corriendo, puedes acceder a:

- **Swagger/OpenAPI**: http://localhost:4002/api/docs
- **Postman Collection**: `docs/postman_collection.json`

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🏗️ Comandos de Desarrollo Rápido

```bash
# Inicio completo con Docker
git clone https://github.com/locopump-utp/task-management-backend.git
cd task-management-backend
docker-compose up -d --build
docker-compose exec app npm run migrate
docker-compose exec app npm run seed

# Verificar
curl http://localhost:4002/api/v1/health
```

**¡Tu API estará corriendo en http://localhost:4002! 🎉**
