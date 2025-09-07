from pydantic import BaseModel
from typing import Optional
from datetime import date

# Student schemas
class StudentBase(BaseModel):
    name: str
    class_day: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    class_day: Optional[str] = None

class Student(StudentBase):
    id: int
    
    class Config:
        from_attributes = True

# Progress schemas
class ProgressBase(BaseModel):
    student_id: int
    week_start: date
    new_memorization: str
    recent_revision: str
    old_revision: str
    teacher_notes: str
    new_memorization_teacher: str = ""
    recent_revision_teacher: str = ""
    old_revision_teacher: str = ""
    
    # Teacher review fields
    new_memorization_fluency: str = ""
    recent_revision_fluency: str = ""
    old_revision_fluency: str = ""
    
    new_memorization_tajweed: str = ""
    recent_revision_tajweed: str = ""
    old_revision_tajweed: str = ""
    
    new_memorization_accuracy: str = ""
    recent_revision_accuracy: str = ""
    old_revision_accuracy: str = ""
    
    new_memorization_confidence: str = ""
    recent_revision_confidence: str = ""
    old_revision_confidence: str = ""

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    week_start: Optional[date] = None
    new_memorization: Optional[str] = None
    recent_revision: Optional[str] = None
    old_revision: Optional[str] = None
    teacher_notes: Optional[str] = None
    new_memorization_teacher: Optional[str] = None
    recent_revision_teacher: Optional[str] = None
    old_revision_teacher: Optional[str] = None
    
    # Teacher review fields
    new_memorization_fluency: Optional[str] = None
    recent_revision_fluency: Optional[str] = None
    old_revision_fluency: Optional[str] = None
    
    new_memorization_tajweed: Optional[str] = None
    recent_revision_tajweed: Optional[str] = None
    old_revision_tajweed: Optional[str] = None
    
    new_memorization_accuracy: Optional[str] = None
    recent_revision_accuracy: Optional[str] = None
    old_revision_accuracy: Optional[str] = None
    
    new_memorization_confidence: Optional[str] = None
    recent_revision_confidence: Optional[str] = None
    old_revision_confidence: Optional[str] = None

class Progress(ProgressBase):
    id: int
    
    class Config:
        from_attributes = True

# Summary schemas
class WeeklySummary(BaseModel):
    student_name: str
    week_start: date
    current_week: Progress
    previous_week: Optional[Progress] = None
    summary_text: str
    new_ayahs_count: int
    revision_pages_count: int

class MonthlySummary(BaseModel):
    student_name: str
    month_start: date
    month_end: date
    total_new_ayahs: int
    total_revision_pages: int
    attendance_weeks: int
    summary_text: str
    weekly_breakdown: list[WeeklySummary]