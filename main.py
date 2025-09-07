from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from dotenv import load_dotenv

from database import engine, Base
from routers import students, progress, summaries, reports

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Quran Memorization Tracker",
    description="POC app for teachers to track Quran memorization and revision progress",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["summaries"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

# Serve static files (for React build) - only if directory exists
import os
if os.path.exists("frontend/build/static"):
    app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

@app.get("/")
async def root():
    return {"message": "Quran Memorization Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)