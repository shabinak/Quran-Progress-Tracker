from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database import get_db, Progress, Student
from models import ProgressCreate, ProgressUpdate, Progress as ProgressModel

router = APIRouter()

@router.post("/", response_model=ProgressModel)
def create_progress(progress: ProgressCreate, db: Session = Depends(get_db)):
    """Create a new progress entry"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == progress.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_progress = Progress(
        student_id=progress.student_id,
        week_start=progress.week_start,
        new_memorization=progress.new_memorization,
        recent_revision=progress.recent_revision,
        old_revision=progress.old_revision,
        teacher_notes=progress.teacher_notes
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress

@router.get("/student/{student_id}", response_model=List[ProgressModel])
def get_student_progress(student_id: int, db: Session = Depends(get_db)):
    """Get all progress entries for a specific student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    progress_entries = db.query(Progress).filter(Progress.student_id == student_id).order_by(Progress.week_start.desc()).all()
    return progress_entries

@router.get("/{progress_id}", response_model=ProgressModel)
def get_progress(progress_id: int, db: Session = Depends(get_db)):
    """Get a specific progress entry by ID"""
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    return progress

@router.put("/{progress_id}", response_model=ProgressModel)
def update_progress(progress_id: int, progress_update: ProgressUpdate, db: Session = Depends(get_db)):
    """Update a progress entry"""
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    if progress_update.week_start is not None:
        progress.week_start = progress_update.week_start
    if progress_update.new_memorization is not None:
        progress.new_memorization = progress_update.new_memorization
    if progress_update.recent_revision is not None:
        progress.recent_revision = progress_update.recent_revision
    if progress_update.old_revision is not None:
        progress.old_revision = progress_update.old_revision
    if progress_update.teacher_notes is not None:
        progress.teacher_notes = progress_update.teacher_notes
    
    db.commit()
    db.refresh(progress)
    return progress

@router.delete("/{progress_id}")
def delete_progress(progress_id: int, db: Session = Depends(get_db)):
    """Delete a progress entry"""
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    db.delete(progress)
    db.commit()
    return {"message": "Progress entry deleted successfully"}
