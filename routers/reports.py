from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date
import os

from database import get_db, Student
from routers.summaries import get_weekly_summary, get_monthly_summary
from report_generator import create_weekly_pdf, create_monthly_pdf

router = APIRouter()

@router.get("/weekly/{student_id}")
def download_weekly_report(student_id: int, week_start: date = None, db: Session = Depends(get_db)):
    """Download weekly progress report as PDF"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get weekly summary
    summary = get_weekly_summary(student_id, week_start, db)
    
    # Generate PDF
    filename = f"weekly_{student.name}_{summary.week_start}.pdf"
    filepath = f"reports/{filename}"
    
    try:
        pdf_path = create_weekly_pdf(summary, filepath)
        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/monthly/{student_id}")
def download_monthly_report(student_id: int, month_start: date = None, db: Session = Depends(get_db)):
    """Download monthly progress report as PDF"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get monthly summary
    summary = get_monthly_summary(student_id, month_start, db)
    
    # Generate PDF
    filename = f"monthly_{student.name}_{summary.month_start.strftime('%Y_%m')}.pdf"
    filepath = f"reports/{filename}"
    
    try:
        pdf_path = create_monthly_pdf(summary, filepath)
        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/list/{student_id}")
def list_reports(student_id: int, db: Session = Depends(get_db)):
    """List available reports for a student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    reports_dir = "reports"
    if not os.path.exists(reports_dir):
        return {"reports": []}
    
    # Find reports for this student
    student_reports = []
    for filename in os.listdir(reports_dir):
        if filename.startswith(f"weekly_{student.name}") or filename.startswith(f"monthly_{student.name}"):
            filepath = os.path.join(reports_dir, filename)
            file_stats = os.stat(filepath)
            student_reports.append({
                "filename": filename,
                "type": "weekly" if filename.startswith("weekly_") else "monthly",
                "created_at": file_stats.st_mtime,
                "size": file_stats.st_size
            })
    
    # Sort by creation time (newest first)
    student_reports.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {"reports": student_reports}
