from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from dotenv import load_dotenv

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal, Student, Progress
from routers import students, progress, summaries, reports, whatsapp
from datetime import date, timedelta

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize sample data for in-memory database (Vercel)
def init_sample_data():
    if os.getenv("VERCEL"):
        try:
            db = SessionLocal()
            # Check if data already exists
            if not db.query(Student).first():
                # Add sample students
                sample_students = [
                    Student(name="Hafsa", class_day="Sunday"),
                    Student(name="Ayesha", class_day="Saturday")
                ]
                for student in sample_students:
                    db.add(student)
                db.commit()
                
                # Add sample progress entries
                hafsa = db.query(Student).filter(Student.name == "Hafsa").first()
                ayesha = db.query(Student).filter(Student.name == "Ayesha").first()
                
                if hafsa:
                    sample_progress = Progress(
                        student_id=hafsa.id,
                        week_start=date.today() - timedelta(days=7),
                        new_memorization="Surah Al-Fatiha Ayah 1-7",
                        recent_revision="Surah Al-Baqarah Ayah 1-10",
                        old_revision="Surah Al-Ikhlas",
                        teacher_notes="Good progress this week"
                    )
                    db.add(sample_progress)
                
                if ayesha:
                    sample_progress = Progress(
                        student_id=ayesha.id,
                        week_start=date.today() - timedelta(days=7),
                        new_memorization="Surah Al-Fatiha Ayah 1-3",
                        recent_revision="Surah Al-Baqarah Ayah 1-5",
                        old_revision="Surah Al-Falaq",
                        teacher_notes="Needs more practice with tajweed"
                    )
                    db.add(sample_progress)
                
                db.commit()
            db.close()
        except Exception as e:
            print(f"Error initializing sample data: {e}")

# Initialize sample data
init_sample_data()

app = FastAPI(
    title="Quran Memorization Tracker",
    description="POC app for teachers to track Quran memorization and revision progress",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["summaries"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])

@app.get("/")
async def root():
    return {"message": "Quran Memorization Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# For Vercel deployment
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
