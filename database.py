from sqlalchemy import create_engine, Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quran_tracker.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    class_day = Column(String)
    
    # Relationship to progress entries
    progress_entries = relationship("Progress", back_populates="student")

class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    week_start = Column(Date)
    new_memorization = Column(Text)
    recent_revision = Column(Text)
    old_revision = Column(Text)
    teacher_notes = Column(Text)
    new_memorization_teacher = Column(String, default="")
    recent_revision_teacher = Column(String, default="")
    old_revision_teacher = Column(String, default="")
    
    # Teacher review fields
    new_memorization_fluency = Column(String, default="")  # Excellent, Good, Fair, Needs Review, Poor
    recent_revision_fluency = Column(String, default="")
    old_revision_fluency = Column(String, default="")
    
    # Detailed feedback
    new_memorization_tajweed = Column(String, default="")  # Excellent, Good, Fair, Needs Review, Poor
    recent_revision_tajweed = Column(String, default="")
    old_revision_tajweed = Column(String, default="")
    
    new_memorization_accuracy = Column(String, default="")  # Excellent, Good, Fair, Needs Review, Poor
    recent_revision_accuracy = Column(String, default="")
    old_revision_accuracy = Column(String, default="")
    
    new_memorization_confidence = Column(String, default="")  # Excellent, Good, Fair, Needs Review, Poor
    recent_revision_confidence = Column(String, default="")
    old_revision_confidence = Column(String, default="")
    
    # Relationship to student
    student = relationship("Student", back_populates="progress_entries")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()