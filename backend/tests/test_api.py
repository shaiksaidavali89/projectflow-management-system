
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200


def test_register_endpoint_validation():
    response = client.post("/auth/register", json={})
    assert response.status_code == 422


def test_login_endpoint_validation():
    response = client.post("/auth/login", json={})
    assert response.status_code == 422


def test_invalid_login():
    response = client.post(
        "/auth/login",
        json={
            "email": "invalid-user@example.com",
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code in (400, 401, 422)


def test_projects_requires_authentication():
    response = client.get("/projects/")
    assert response.status_code == 401


def test_tasks_requires_authentication():
    response = client.get("/tasks/")
    assert response.status_code == 401


def test_create_project_requires_authentication():
    response = client.post(
        "/projects/",
        json={
            "name": "Test Project",
            "description": "Automated test project"
        }
    )
    assert response.status_code == 401


def test_create_task_requires_authentication():
    response = client.post(
        "/tasks/",
        json={
            "title": "Test Task",
            "description": "Automated test task",
            "project_id": 1,
            "assigned_to": 2,
            "priority": "High",
            "status": "To Do"
        }
    )
    assert response.status_code == 401
