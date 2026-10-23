import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.services.platform_metrics import database_health
import app.models  # Registers all models with Base
from app.api.v1.router import api_router
from app.middleware import request_context

request_context.configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and run safe schema migrations
    try:
        from app.core.migrations import run_database_migrations
        run_database_migrations()
    except Exception:
        logging.getLogger("repsi.startup").exception("Database initialization failed")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request IDs, access log, secure headers, body-size cap (outermost, so it wraps CORS responses too)
request_context.install(app)

# Register v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Liveness plus a real database round trip (load balancers and uptime monitors poll this)."""
    database = database_health(db)
    healthy = database["status"] == "HEALTHY"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "healthy" if healthy else "degraded",
            "environment": settings.ENVIRONMENT,
            "database": "connected" if healthy else "unreachable",
            "database_latency_ms": database["latency_ms"],
        },
    )
