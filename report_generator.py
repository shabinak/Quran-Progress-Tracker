from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os
from typing import Optional
from models import WeeklySummary, MonthlySummary

def create_weekly_pdf(summary: WeeklySummary, output_path: str = None) -> str:
    """Generate a PDF report for weekly summary"""
    if not output_path:
        output_path = f"reports/weekly_{summary.student_name}_{summary.week_start}.pdf"
    
    # Ensure reports directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkgreen
    )
    story.append(Paragraph("Weekly Progress Report", title_style))
    story.append(Spacer(1, 12))
    
    # Student info
    info_style = ParagraphStyle(
        'Info',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6
    )
    story.append(Paragraph(f"<b>Student:</b> {summary.student_name}", info_style))
    story.append(Paragraph(f"<b>Week of:</b> {summary.week_start.strftime('%B %d, %Y')}", info_style))
    story.append(Spacer(1, 20))
    
    # Progress details
    story.append(Paragraph("Progress Details", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    # Create progress table
    progress_data = [
        ['Category', 'Details'],
        ['New Memorization', summary.current_week.new_memorization],
        ['Recent Revision', summary.current_week.recent_revision],
        ['Old Revision', summary.current_week.old_revision],
        ['Teacher Notes', summary.current_week.teacher_notes]
    ]
    
    progress_table = Table(progress_data, colWidths=[2*inch, 4*inch])
    progress_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(progress_table)
    story.append(Spacer(1, 20))
    
    # Statistics
    story.append(Paragraph("Statistics", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    stats_data = [
        ['Metric', 'Count'],
        ['New Ayahs Memorized', str(summary.new_ayahs_count)],
        ['Revision Pages Covered', str(summary.revision_pages_count)]
    ]
    
    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 20))
    
    # AI Summary
    story.append(Paragraph("Teacher's Summary", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    summary_style = ParagraphStyle(
        'Summary',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    story.append(Paragraph(summary.summary_text, summary_style))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    
    doc.build(story)
    return output_path

def create_monthly_pdf(summary: MonthlySummary, output_path: str = None) -> str:
    """Generate a PDF report for monthly summary"""
    if not output_path:
        output_path = f"reports/monthly_{summary.student_name}_{summary.month_start.strftime('%Y_%m')}.pdf"
    
    # Ensure reports directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    story.append(Paragraph("Monthly Progress Report", title_style))
    story.append(Spacer(1, 12))
    
    # Student info
    info_style = ParagraphStyle(
        'Info',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6
    )
    story.append(Paragraph(f"<b>Student:</b> {summary.student_name}", info_style))
    story.append(Paragraph(f"<b>Month:</b> {summary.month_start.strftime('%B %Y')}", info_style))
    story.append(Spacer(1, 20))
    
    # Monthly statistics
    story.append(Paragraph("Monthly Statistics", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    stats_data = [
        ['Metric', 'Total'],
        ['New Ayahs Memorized', str(summary.total_new_ayahs)],
        ['Revision Pages Covered', str(summary.total_revision_pages)],
        ['Weeks of Attendance', f"{summary.attendance_weeks}/4"],
        ['Attendance Rate', f"{(summary.attendance_weeks/4)*100:.1f}%"]
    ]
    
    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 20))
    
    # Weekly breakdown
    story.append(Paragraph("Weekly Breakdown", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    for i, week in enumerate(summary.weekly_breakdown, 1):
        story.append(Paragraph(f"Week {i} - {week.week_start.strftime('%B %d, %Y')}", styles['Heading3']))
        story.append(Spacer(1, 8))
        
        week_data = [
            ['Category', 'Details'],
            ['New Memorization', week.current_week.new_memorization],
            ['Recent Revision', week.current_week.recent_revision],
            ['Old Revision', week.current_week.old_revision],
            ['Teacher Notes', week.current_week.teacher_notes],
            ['New Ayahs', str(week.new_ayahs_count)],
            ['Revision Pages', str(week.revision_pages_count)]
        ]
        
        week_table = Table(week_data, colWidths=[2*inch, 4*inch])
        week_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(week_table)
        story.append(Spacer(1, 12))
        
        # Week summary
        story.append(Paragraph("Summary:", styles['Heading4']))
        summary_style = ParagraphStyle(
            'WeekSummary',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT
        )
        story.append(Paragraph(week.summary_text, summary_style))
        story.append(Spacer(1, 20))
    
    # Monthly AI Summary
    story.append(Paragraph("Monthly Summary", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    summary_style = ParagraphStyle(
        'MonthlySummary',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    story.append(Paragraph(summary.summary_text, summary_style))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    
    doc.build(story)
    return output_path
