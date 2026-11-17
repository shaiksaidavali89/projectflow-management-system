\# Advanced Project \& Team Management System



A full-stack web application for managing projects, teams, tasks, deadlines and project performance.



\## Technologies



\### Frontend

\- React.js

\- Vite

\- Axios

\- React Router



\### Backend

\- Python

\- FastAPI

\- SQLAlchemy

\- Alembic



\### Database

\- PostgreSQL



\## Features

\- User authentication

\- Project management

\- Task management

\- Team member assignment

\- Task priorities and statuses

\- Comments and activity logs

\- Search, filter and pagination



# ProjectFlow – Advanced Project & Team Management System

ProjectFlow is a full-stack web application designed to manage projects, tasks, team members, and collaboration activities in one centralized workspace.

## Features

### Authentication and Authorization
- User registration and login
- JWT-based authentication
- Password hashing
- Role-based access control
- Admin, Project Manager, and Team Member roles

### Dashboard
- Total projects
- Total tasks
- Completed tasks
- Pending tasks
- Recent projects

### Project Management
- Create projects
- View all projects
- Update project details
- Delete projects
- Search and filter projects
- Manage project members

### Task Management
- Create, view, update, and delete tasks
- Assign tasks to users
- Set task priorities
- Update task status
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
- Assign members to projects
- Remove members from projects

### Collaboration
- Task comments
- Activity history
- Project member management

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- Axios
- CSS
- React Router DOM

### Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication
- Passlib and bcrypt
- Pydantic

### Database
- PostgreSQL
- Alembic Database Migrations

## Project Structure

```text
advanced-project-management/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── scripts/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── Projects.jsx
│   │   ├── Tasks.jsx
│   │   ├── Kanban.jsx
│   │   ├── TeamMembers.jsx
│   │   └── components/
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

## Database Tables

The application uses the following tables:

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
git clone YOUR_GITHUB_REPOSITORY_URL
cd advanced-project-management
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Configure your backend `.env` file with your PostgreSQL connection string and a secure JWT secret.

Apply database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
```

Configure the frontend `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

http://localhost:5173

## API Modules

| Module | Description |
|---|---|
| Authentication | Register, login, and current user |
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
- Automated testing
- Cloud deployment

## Author

Project developed as an Advanced Project & Team Management System.

## License

This project is developed for educational and demonstration purposes.
