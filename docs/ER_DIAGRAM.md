
# ProjectFlow – Database ER Diagram

## Database
PostgreSQL

## ORM
SQLAlchemy

## Migration Tool
Alembic

## Database Tables

### 1. Roles
Stores application roles.

- id – Primary Key
- name – Role name

### 2. Users
Stores registered users.

- id – Primary Key
- full_name – User's full name
- email – Unique email address
- hashed_password – Hashed password
- role_id – Foreign Key referencing Roles
- is_active – Account status
- created_at – Registration timestamp

### 3. Projects
Stores project information.

- id – Primary Key
- name – Project name
- description – Project description
- status – Project status
- start_date – Project start date
- deadline – Project deadline
- created_by – Foreign Key referencing Users
- created_at – Creation timestamp

### 4. Project Members
Manages project and user assignments.

- id – Primary Key
- project_id – Foreign Key referencing Projects
- user_id – Foreign Key referencing Users
- joined_at – Membership timestamp

### 5. Tasks
Stores tasks associated with projects.

- id – Primary Key
- title – Task title
- description – Task description
- project_id – Foreign Key referencing Projects
- assigned_to – Foreign Key referencing Users
- created_by – Foreign Key referencing Users
- priority – Low, Medium, High, Critical
- status – To Do, In Progress, Review, Completed
- due_date – Task deadline
- created_at – Creation timestamp

### 6. Task Comments
Stores comments added to tasks.

- id – Primary Key
- task_id – Foreign Key referencing Tasks
- user_id – Foreign Key referencing Users
- comment – Comment content
- created_at – Comment timestamp

### 7. Activity Logs
Tracks application activities.

- id – Primary Key
- user_id – Foreign Key referencing Users
- project_id – Foreign Key referencing Projects
- task_id – Foreign Key referencing Tasks
- action – Activity name
- details – Activity description
- created_at – Activity timestamp

## Relationships

1. One Role can be assigned to multiple Users.
2. One User can create multiple Projects.
3. One Project can have multiple Project Members.
4. One User can join multiple Projects.
5. One Project can contain multiple Tasks.
6. One User can be assigned multiple Tasks.
7. One Task can have multiple Comments.
8. One User can write multiple Comments.
9. Activity Logs record actions performed by Users.
10. Activity Logs can reference Projects and Tasks.

## ER Diagram

See the Mermaid ER diagram in this document's companion diagram section or the project documentation.
