
# ProjectFlow – Advanced Project & Team Management System

ProjectFlow is a full-stack project and team management application designed to organize projects, tasks, team members, and collaboration activities in one centralized workspace.

## Features

### Authentication and Authorization
- User registration and login
- JWT-based authentication
- Password hashing
- Role-based access control
- Admin, Project Manager, and Team Member roles

### Dashboard
- Total projects and tasks
- Completed and pending tasks
- Recent projects

### Project Management
- Create, view, update, and delete projects
- Search and filter projects
- Manage project members

### Task Management
- Create, view, update, and delete tasks
- Assign tasks to users
- Set priorities: Low, Medium, High, Critical
- Track task status
- Search and filter tasks
- Set task due dates

### Kanban Board
- To Do
- In Progress
- Review
- Completed
- Update task status through the board

### Team Management
- View registered users
- Update user roles
- Activate and deactivate accounts
- Assign and remove project members

### Collaboration
- Task comments
- Activity history
- Project member management

### Automated Testing
- Pytest-based backend API tests
- Health endpoint tests
- Authentication validation tests
- Project and task authorization tests

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, Axios, CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Authentication | JWT, Passlib, bcrypt |
| Database | PostgreSQL |
| Migrations | Alembic |
| Testing | Pytest, HTTPX |
| API Documentation | Swagger UI, Postman |

## Project Structure

```text
advanced-project-management/
|
|-- backend/
|   |-- app/
|   |   |-- models/
|   |   |-- routers/
|   |   |-- schemas/
|   |   |-- utils/
|   |   |-- database.py
|   |   |-- main.py
|   |
|   |-- alembic/
|   |-- scripts/
|   |-- tests/
|   |   |-- test_api.py
|   |
|   |-- requirements.txt
|   |-- alembic.ini
|   |-- .env.example
|
|-- frontend/
|   |-- src/
|   |   |-- services/
|   |   |-- components/
|   |   |-- App.jsx
|   |   |-- Projects.jsx
|   |   |-- Tasks.jsx
|   |   |-- Kanban.jsx
|   |   |-- TeamMembers.jsx
|   |
|   |-- package.json
|   |-- .env.example
|
|-- docs/
|-- postman/
|-- .gitignore
|-- README.md
```

## Database Tables

The application uses the following PostgreSQL tables:

1. Users
2. Roles
3. Projects
4. Project Members
5. Tasks
6. Task Comments
7. Activity Logs

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shaiksaidavali89/projectflow-management-system.git

cd projectflow-management-system
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in the backend directory using your own PostgreSQL credentials and a secure JWT secret.

Apply database migrations:

```bash
python -m alembic upgrade head
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Swagger API documentation:

http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

http://localhost:5173

## Running Automated Tests

Open a terminal in the backend directory.

Activate the virtual environment:

```bash
venv\Scripts\activate
```

Run all automated tests:

```bash
python -m pytest -v
```

The current test suite includes nine tests covering:

- Root endpoint
- Health endpoint
- Registration validation
- Login validation
- Invalid login
- Project authentication
- Task authentication
- Project creation authorization
- Task creation authorization

Latest verified result: **9 tests passed.**

## API Modules

| Module | Description |
|---|---|
| Authentication | Registration, login, current user |
| Users | User management and roles |
| Projects | Project CRUD operations |
| Tasks | Task CRUD operations |
| Project Members | Assign and remove members |
| Comments | Task comments |
| Activity Logs | Track application activities |

## Security

- JWT-based authentication
- Password hashing
- Role-based authorization
- Environment variables for sensitive configuration
- API request validation

## Future Enhancements

- Real-time notifications using WebSockets
- Email notifications
- File attachments
- Docker deployment
- Expanded automated test coverage
- Cloud deployment

## Author

Developed as an Advanced Project & Team Management System.

## License

This project is developed for educational and demonstration purposes.
