from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import os
from datetime import date

from database import get_db, Student, Progress
from routers.summaries import get_weekly_summary
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from whatsapp_simple import get_whatsapp_share_link, create_weekly_report_message
from whatsapp_integration import send_weekly_report_whatsapp

router = APIRouter()

@router.get("/weekly/{student_id}/whatsapp-link")
def get_weekly_whatsapp_link(
    student_id: int, 
    week_start: Optional[date] = None,
    phone_number: str = Query(..., description="Student's phone number with country code (e.g., +1234567890)"),
    db: Session = Depends(get_db)
):
    """Generate WhatsApp link for weekly report"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get weekly summary
    try:
        summary = get_weekly_summary(student_id, week_start, db)
        
        # Create report data
        report_data = {
            "new_memorization": summary.current_week.new_memorization,
            "recent_revision": summary.current_week.recent_revision,
            "old_revision": summary.current_week.old_revision,
            "teacher_notes": summary.current_week.teacher_notes,
            "summary_text": summary.summary_text
        }
        
        # Generate WhatsApp link
        whatsapp_link = get_whatsapp_share_link(phone_number, student.name, report_data)
        
        return {
            "student_name": student.name,
            "phone_number": phone_number,
            "whatsapp_link": whatsapp_link,
            "message_preview": create_weekly_report_message(student.name, report_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating WhatsApp link: {str(e)}")

@router.post("/weekly/{student_id}/send-whatsapp")
def send_weekly_whatsapp(
    student_id: int,
    phone_number: str = Query(..., description="Student's phone number with country code"),
    week_start: Optional[date] = None,
    report_url: Optional[str] = Query(None, description="URL to PDF report (optional)"),
    db: Session = Depends(get_db)
):
    """Send weekly report via WhatsApp (requires WhatsApp Business API setup)"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if WhatsApp credentials are configured
    if not os.getenv("WHATSAPP_ACCESS_TOKEN"):
        raise HTTPException(
            status_code=400, 
            detail="WhatsApp Business API not configured. Please set WHATSAPP_ACCESS_TOKEN environment variable."
        )
    
    try:
        # Send via WhatsApp Business API
        success = send_weekly_report_whatsapp(phone_number, student.name, report_url)
        
        if success:
            return {
                "message": "Weekly report sent successfully via WhatsApp",
                "student_name": student.name,
                "phone_number": phone_number
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending WhatsApp message: {str(e)}")

@router.get("/weekly/{student_id}/whatsapp-preview")
def preview_weekly_whatsapp_message(
    student_id: int,
    week_start: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Preview the WhatsApp message that would be sent"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        # Get weekly summary
        summary = get_weekly_summary(student_id, week_start, db)
        
        # Create report data
        report_data = {
            "new_memorization": summary.current_week.new_memorization,
            "recent_revision": summary.current_week.recent_revision,
            "old_revision": summary.current_week.old_revision,
            "teacher_notes": summary.current_week.teacher_notes,
            "summary_text": summary.summary_text
        }
        
        # Generate message preview
        message_preview = create_weekly_report_message(student.name, report_data)
        
        return {
            "student_name": student.name,
            "week_start": summary.week_start,
            "message_preview": message_preview,
            "message_length": len(message_preview)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating message preview: {str(e)}")
