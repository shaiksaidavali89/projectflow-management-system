
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, SessionLocal
from app.models import Role
from app.routers import auth, users, projects, tasks, comments, activity, members

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advanced Project & Team Management System",
    description="API for managing projects, teams, tasks and authentication",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Connect API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(activity.router)
app.include_router(members.router)


@app.on_event("startup")
def create_default_roles():
    db = SessionLocal()

    try:
        default_roles = [
            "Admin",
            "Project Manager",
            "Team Member"
        ]

        for role_name in default_roles:
            existing_role = db.query(Role).filter(
                Role.name == role_name
            ).first()

            if not existing_role:
                db.add(Role(name=role_name))

        db.commit()
        logger.info("Default roles verified successfully")

    except Exception:
        db.rollback()
        logger.exception("Unable to create default roles")
        raise

    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Advanced Project Management API",
        "status": "Running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend is running successfully"
    }


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "PostgreSQL",
            "message": "Database connection successful"
        }

    except Exception:
        logger.exception("Database connection failed")
        raise HTTPException(
            status_code=503,
            detail="Database connection failed. Check backend configuration."
        )
