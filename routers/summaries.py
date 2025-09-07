from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from database import get_db, Progress, Student
from models import WeeklySummary, MonthlySummary, Progress as ProgressModel
from llm_service import generate_weekly_summary, generate_monthly_summary, count_ayahs

router = APIRouter()

@router.get("/weekly/{student_id}", response_model=WeeklySummary)
def get_weekly_summary(student_id: int, week_start: Optional[date] = None, db: Session = Depends(get_db)):
    """Get weekly summary for a student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If no week_start provided, get the most recent week
    if not week_start:
        latest_progress = db.query(Progress).filter(Progress.student_id == student_id).order_by(Progress.week_start.desc()).first()
        if not latest_progress:
            raise HTTPException(status_code=404, detail="No progress entries found for this student")
        week_start = latest_progress.week_start
    
    # Get current week progress
    current_week = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.week_start == week_start
    ).first()
    
    if not current_week:
        raise HTTPException(status_code=404, detail="No progress entry found for the specified week")
    
    # Get previous week progress
    previous_week_start = week_start - timedelta(days=7)
    previous_week = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.week_start == previous_week_start
    ).first()
    
    # Count ayahs and pages
    new_ayahs_count = count_ayahs(current_week.new_memorization)
    revision_pages_count = count_ayahs(current_week.recent_revision) + count_ayahs(current_week.old_revision)
    
    # Generate AI summary
    summary_text = generate_weekly_summary(current_week, previous_week, student.name)
    
    return WeeklySummary(
        student_name=student.name,
        week_start=week_start,
        current_week=current_week,
        previous_week=previous_week,
        summary_text=summary_text,
        new_ayahs_count=new_ayahs_count,
        revision_pages_count=revision_pages_count
    )

@router.get("/monthly/{student_id}", response_model=MonthlySummary)
def get_monthly_summary(student_id: int, month_start: Optional[date] = None, db: Session = Depends(get_db)):
    """Get monthly summary for a student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If no month_start provided, get the most recent month
    if not month_start:
        latest_progress = db.query(Progress).filter(Progress.student_id == student_id).order_by(Progress.week_start.desc()).first()
        if not latest_progress:
            raise HTTPException(status_code=404, detail="No progress entries found for this student")
        # Get the first day of the month
        month_start = latest_progress.week_start.replace(day=1)
    
    # Calculate month end
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
    
    # Get all progress entries for the month
    progress_entries = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.week_start >= month_start,
        Progress.week_start <= month_end
    ).order_by(Progress.week_start).all()
    
    if not progress_entries:
        raise HTTPException(status_code=404, detail="No progress entries found for the specified month")
    
    # Generate weekly summaries for each week
    weekly_summaries = []
    for progress in progress_entries:
        # Get previous week for comparison
        previous_week_start = progress.week_start - timedelta(days=7)
        previous_week = db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.week_start == previous_week_start
        ).first()
        
        new_ayahs_count = count_ayahs(progress.new_memorization)
        revision_pages_count = count_ayahs(progress.recent_revision) + count_ayahs(progress.old_revision)
        
        summary_text = generate_weekly_summary(progress, previous_week, student.name)
        
        weekly_summary = WeeklySummary(
            student_name=student.name,
            week_start=progress.week_start,
            current_week=progress,
            previous_week=previous_week,
            summary_text=summary_text,
            new_ayahs_count=new_ayahs_count,
            revision_pages_count=revision_pages_count
        )
        weekly_summaries.append(weekly_summary)
    
    # Calculate totals
    total_new_ayahs = sum(ws.new_ayahs_count for ws in weekly_summaries)
    total_revision_pages = sum(ws.revision_pages_count for ws in weekly_summaries)
    attendance_weeks = len(weekly_summaries)
    
    # Generate monthly AI summary
    summary_text = generate_monthly_summary(weekly_summaries, student.name, month_start, month_end)
    
    return MonthlySummary(
        student_name=student.name,
        month_start=month_start,
        month_end=month_end,
        total_new_ayahs=total_new_ayahs,
        total_revision_pages=total_revision_pages,
        attendance_weeks=attendance_weeks,
        summary_text=summary_text,
        weekly_breakdown=weekly_summaries
    )
