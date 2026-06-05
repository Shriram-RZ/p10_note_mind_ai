from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from app.config import settings
from app.database import engine, Base
from app.models import *
from app.routers import auth, notes, folders, tags, files, ai, dashboard, chat, flashcards, quizzes, mind_maps

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("NoteMind AI Backend started!")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="NoteMind AI API",
    description="AI-powered smart notes and learning companion",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.time() - start)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    # Error responses are produced outside the CORS middleware, so attach the
    # CORS headers here. Without them the browser reports a misleading
    # "blocked by CORS policy" instead of surfacing the real 500.
    headers = {}
    origin = request.headers.get("origin")
    if origin and origin in settings.allowed_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
        headers=headers,
    )

for router in [auth.router, notes.router, folders.router, tags.router, files.router,
               ai.router, dashboard.router, chat.router, flashcards.router, quizzes.router, mind_maps.router]:
    app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"app": "NoteMind AI", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
