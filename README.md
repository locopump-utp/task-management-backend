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
docker-compose logs -f api    # Ver logs del API
docker-compose down           # Parar servicios
docker-compose down -v        # Parar y eliminar volúmenes

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Endpoints

### 🔐 Autenticación
```
POST   /api/auth/register     # Registrar usuario
POST   /api/auth/login        # Iniciar sesión
POST   /api/auth/logout       # Cerrar sesión
GET    /api/auth/me           # Obtener perfil actual
POST   /api/auth/refresh      # Renovar token
```

### 👥 Proyectos
```
GET    /api/projects          # Listar proyectos
POST   /api/projects          # Crear proyecto
GET    /api/projects/:id      # Obtener proyecto
PUT    /api/projects/:id      # Actualizar proyecto
DELETE /api/projects/:id      # Eliminar proyecto
POST   /api/projects/:id/members    # Agregar miembro
DELETE /api/projects/:id/members/:userId  # Remover miembro
```

### ✅ Tareas
```
GET    /api/tasks             # Listar tareas
POST   /api/tasks             # Crear tarea
GET    /api/tasks/:id         # Obtener tarea
PUT    /api/tasks/:id         # Actualizar tarea
DELETE /api/tasks/:id         # Eliminar tarea
GET    /api/projects/:id/tasks # Tareas de un proyecto
```

### 👤 Usuarios
```
GET    /api/users             # Listar usuarios (admin)
GET    /api/users/:id         # Obtener usuario
PUT    /api/users/:id         # Actualizar usuario
```

### 📊 Dashboard
```
GET    /api/dashboard         # Dashboard general
GET    /api/dashboard/projects # Dashboard de proyectos
GET    /api/dashboard/tasks   # Dashboard de tareas
GET    /api/dashboard/admin   # Dashboard admin (solo admin)
```

## 🔒 Variables de Entorno

```bash
# Servidor
NODE_ENV=development
PORT=4002
HOST=localhost

# Base de datos
MONGODB_URI=mongodb://localhost:27017/task_management
DB_NAME=task_management

# JWT
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=task-management-api

# Seguridad
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5

# Archivos
MAX_FILE_SIZE=5242880
```

## 🗄️ Esquema de Base de Datos

### 👤 Users Collection
```javascript
{
  _id: ObjectId,
  name: string,
  email: string,           // único
  password: string,        // hasheado
  role: 'admin' | 'user',
  avatar?: string,
  isActive: boolean,
  lastLogin?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 📁 Projects Collection
```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  owner: ObjectId,         // User ID
  members: ObjectId[],     // Array de User IDs
  status: 'active' | 'completed' | 'paused',
  createdAt: Date,
  updatedAt: Date
}
```

### ✅ Tasks Collection
```javascript
{
  _id: ObjectId,
  title: string,
  description: string,
  projectId: ObjectId,
  assignedTo: ObjectId,    // User ID
  status: 'todo' | 'in_progress' | 'completed',
  priority: 'low' | 'medium' | 'high',
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🔐 Autenticación y Autorización

### Roles de Usuario
- **admin**: Acceso completo al sistema
- **user**: Acceso limitado a sus proyectos y tareas

### Middleware de Autenticación
- `authenticate`: Requiere token JWT válido
- `requireAdmin`: Solo administradores
- `requireUser`: Usuarios autenticados
- `requireOwnership`: Solo propietario del recurso
- `requireProjectMember`: Solo miembros del proyecto

## 📈 Características de Producción

- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta
- ✅ **CORS**: Configuración de dominios permitidos
- ✅ **Helmet**: Headers de seguridad
- ✅ **Compresión**: Respuestas comprimidas con gzip
- ✅ **Logging**: Sistema de logs con Morgan
- ✅ **Health Check**: Endpoint de verificación de estado
- ✅ **Error Handling**: Manejo centralizado de errores
- ✅ **Validación**: Validación robusta con Zod

## 🚀 Despliegue

### Docker Production
```bash
# Construir imagen de producción
docker build -t task-management-api .

# Ejecutar contenedor
docker run -d -p 4002:4002 --env-file .env.production task-management-api
```

### Variables de Entorno de Producción
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-super-secure-production-secret
# ... otras variables
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Frank Cáceres** - *locopump* - *AkisoftTech*

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue si es necesario

---

⭐ **¡No olvides dar una estrella al proyecto si te ha sido útil!**
