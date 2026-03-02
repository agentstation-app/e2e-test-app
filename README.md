# Task Manager API

A simple task management REST API built with Express and TypeScript.

## Features

- User authentication (JWT)
- Task CRUD operations
- Task assignment and priority management
- Role-based access control
- Input validation with Zod

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run database migrations: `psql < src/db/schema.sql`
5. Start the server: `npm run dev`

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT token

### Tasks
- `GET /api/tasks` — List tasks (with filters)
- `GET /api/tasks/:id` — Get task details
- `POST /api/tasks` — Create a task
- `PUT /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task

### Users
- `GET /api/users/me` — Get current user
- `GET /api/users` — List all users (admin only)
- `DELETE /api/users/:id` — Delete a user (admin only)

## License

MIT