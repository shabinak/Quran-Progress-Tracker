import os
from typing import Optional
from models import Progress, WeeklySummary, MonthlySummary
from datetime import date, timedelta

# Initialize OpenAI client (optional)
try:
    import openai
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_AVAILABLE = True
except Exception as e:
    print(f"OpenAI not available: {e}")
    client = None
    OPENAI_AVAILABLE = False

def generate_weekly_summary(current_week: Progress, previous_week: Optional[Progress], student_name: str) -> str:
    """Generate a natural language summary for weekly progress"""
    
    if not OPENAI_AVAILABLE:
        return generate_fallback_weekly_summary(current_week, previous_week, student_name)
    
    prompt = f"""
    As a Quran memorization teacher, provide a constructive weekly progress summary for student {student_name}.
    
    Current Week Progress:
    - New Memorization: {current_week.new_memorization}
    - Recent Revision: {current_week.recent_revision}
    - Old Revision: {current_week.old_revision}
    - Teacher Notes: {current_week.teacher_notes}
    
    """
    
    if previous_week:
        prompt += f"""
        Previous Week Progress:
        - New Memorization: {previous_week.new_memorization}
        - Recent Revision: {previous_week.recent_revision}
        - Old Revision: {previous_week.old_revision}
        - Teacher Notes: {previous_week.teacher_notes}
        
        Please compare the two weeks and highlight improvements, areas of concern, and recommendations.
        """
    else:
        prompt += """
        This is the first week of tracking for this student. Please provide an encouraging summary and set expectations.
        """
    
    prompt += """
    Keep the tone professional but encouraging. Focus on:
    1. Progress made in memorization
    2. Consistency in revision
    3. Areas for improvement
    4. Encouragement and motivation
    5. Specific recommendations for next week
    
    Limit the summary to 2-3 paragraphs.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an experienced Quran memorization teacher providing weekly progress feedback to students and parents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        # Generate a fallback summary when AI is unavailable
        return generate_fallback_weekly_summary(current_week, previous_week, student_name)

def generate_monthly_summary(weekly_summaries: list[WeeklySummary], student_name: str, month_start: date, month_end: date) -> str:
    """Generate a natural language summary for monthly progress"""
    
    if not OPENAI_AVAILABLE:
        return generate_fallback_monthly_summary(weekly_summaries, student_name, month_start, month_end)
    
    total_new_ayahs = sum(ws.new_ayahs_count for ws in weekly_summaries)
    total_revision_pages = sum(ws.revision_pages_count for ws in weekly_summaries)
    attendance_weeks = len(weekly_summaries)
    
    prompt = f"""
    As a Quran memorization teacher, provide a comprehensive monthly progress summary for student {student_name} for the period {month_start} to {month_end}.
    
    Monthly Statistics:
    - Total New Ayahs Memorized: {total_new_ayahs}
    - Total Revision Pages Covered: {total_revision_pages}
    - Weeks of Attendance: {attendance_weeks}/4
    """
    
    prompt += """
    Please provide a comprehensive monthly summary that includes:
    1. Overall progress assessment
    2. Consistency analysis
    3. Strengths demonstrated
    4. Areas needing improvement
    5. Recommendations for next month
    6. Encouragement and motivation
    
    Focus on the monthly statistics and overall trends rather than weekly details.
    Keep the tone professional but encouraging. Limit to 3-4 paragraphs.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an experienced Quran memorization teacher providing monthly progress reports to students and parents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        # Generate a fallback summary when AI is unavailable
        return generate_fallback_monthly_summary(weekly_summaries, student_name, month_start, month_end)

def count_ayahs(text: str) -> int:
    """Enhanced function to count ayahs mentioned in text"""
    if not text:
        return 0
    
    import re
    
    count = 0
    processed_positions = set()  # Track processed character positions to avoid double counting
    
    # First, handle ayah ranges: "Ayah 1-10", "Ayah 5-15", etc.
    ayah_ranges = re.finditer(r'Ayah\s+(\d+)-(\d+)', text)
    for match in ayah_ranges:
        try:
            start_num = int(match.group(1))
            end_num = int(match.group(2))
            if start_num <= end_num:
                # Count the range: end - start + 1
                range_count = end_num - start_num + 1
                count += range_count
                # Mark this range as processed
                for i in range(match.start(), match.end()):
                    processed_positions.add(i)
        except ValueError:
            continue
    
    # Then, handle single ayah references that are NOT part of ranges: "Ayah 5", "Ayah 10", etc.
    single_ayahs = re.finditer(r'Ayah\s+(\d+)(?!\s*-\s*\d+)', text)
    for match in single_ayahs:
        # Check if this single ayah is not part of a processed range
        if not any(pos in processed_positions for pos in range(match.start(), match.end())):
            try:
                ayah_num = int(match.group(1))
                if ayah_num > 0:
                    count += 1
            except ValueError:
                continue
    
    # Fallback: Look for old format ranges like "1-10", "5-15", etc. (without "Ayah" prefix)
    if count == 0:
        ranges = re.finditer(r'(\d+)-(\d+)', text)
        for match in ranges:
            # Check if this range is not part of a processed "Ayah X-Y" pattern
            if not any(pos in processed_positions for pos in range(match.start(), match.end())):
                try:
                    start_num = int(match.group(1))
                    end_num = int(match.group(2))
                    if start_num <= end_num and end_num - start_num <= 50:  # Reasonable ayah range
                        range_count = end_num - start_num + 1
                        count += range_count
                except ValueError:
                    continue
    
    # Final fallback: Count single numbers (be more conservative)
    if count == 0:
        single_numbers = re.finditer(r'\b(\d+)\b', text)
        for match in single_numbers:
            # Check if this number is not part of a processed range
            if not any(pos in processed_positions for pos in range(match.start(), match.end())):
                try:
                    num = int(match.group(1))
                    if 1 <= num <= 20:  # Reasonable single ayah range
                        count += 1
                except ValueError:
                    continue
    
    return count

def generate_fallback_weekly_summary(current_week: Progress, previous_week: Optional[Progress], student_name: str) -> str:
    """Generate a fallback weekly summary when AI is unavailable"""
    
    summary_parts = []
    
    # Opening statement
    summary_parts.append(f"Weekly Progress Summary for {student_name}")
    summary_parts.append("=" * 50)
    
    # Current week progress
    summary_parts.append(f"\nThis week's progress:")
    if current_week.new_memorization:
        summary_parts.append(f"• New Memorization: {current_week.new_memorization}")
    if current_week.recent_revision:
        summary_parts.append(f"• Recent Revision: {current_week.recent_revision}")
    if current_week.old_revision:
        summary_parts.append(f"• Old Revision: {current_week.old_revision}")
    if current_week.teacher_notes:
        summary_parts.append(f"• Teacher Notes: {current_week.teacher_notes}")
    
    # Comparison with previous week if available
    if previous_week:
        summary_parts.append(f"\nComparison with previous week:")
        if previous_week.new_memorization and current_week.new_memorization:
            summary_parts.append(f"• Previous week new memorization: {previous_week.new_memorization}")
        if previous_week.recent_revision and current_week.recent_revision:
            summary_parts.append(f"• Previous week recent revision: {previous_week.recent_revision}")
    
    # Encouragement and recommendations
    summary_parts.append(f"\nKeep up the good work, {student_name}! Continue practicing regularly and maintain consistency in your memorization schedule.")
    
    if current_week.new_memorization:
        summary_parts.append("Focus on perfecting the new material you've learned this week.")
    if current_week.recent_revision:
        summary_parts.append("Continue reviewing your recent memorization to ensure retention.")
    if current_week.old_revision:
        summary_parts.append("Maintain your old revision schedule to keep previously memorized portions fresh.")
    
    summary_parts.append("\nMay Allah bless your efforts in memorizing the Quran. Ameen.")
    
    return "\n".join(summary_parts)

def generate_fallback_monthly_summary(weekly_summaries: list[WeeklySummary], student_name: str, month_start: date, month_end: date) -> str:
    """Generate a fallback monthly summary when AI is unavailable"""
    
    total_new_ayahs = sum(ws.new_ayahs_count for ws in weekly_summaries)
    total_revision_pages = sum(ws.revision_pages_count for ws in weekly_summaries)
    attendance_weeks = len(weekly_summaries)
    
    summary_parts = []
    
    # Header
    summary_parts.append(f"Monthly Progress Summary for {student_name}")
    summary_parts.append(f"Period: {month_start.strftime('%B %d, %Y')} to {month_end.strftime('%B %d, %Y')}")
    summary_parts.append("=" * 60)
    
    # Monthly statistics
    summary_parts.append(f"\nMonthly Statistics:")
    summary_parts.append(f"• Total New Ayahs Memorized: {total_new_ayahs}")
    summary_parts.append(f"• Total Revision Pages Covered: {total_revision_pages}")
    summary_parts.append(f"• Weeks of Attendance: {attendance_weeks}/4")
    summary_parts.append(f"• Attendance Rate: {((attendance_weeks/4)*100):.1f}%")
    
    
    # Overall assessment
    summary_parts.append(f"\nOverall Assessment:")
    if attendance_weeks >= 3:
        summary_parts.append(f"Excellent attendance this month! {student_name} has been very consistent.")
    elif attendance_weeks >= 2:
        summary_parts.append(f"Good attendance this month. {student_name} has been mostly consistent.")
    else:
        summary_parts.append(f"Attendance could be improved. Let's work on being more consistent next month.")
    
    if total_new_ayahs > 0:
        summary_parts.append(f"Great progress in memorization with {total_new_ayahs} new ayahs learned!")
    
    if total_revision_pages > 0:
        summary_parts.append(f"Good revision work with {total_revision_pages} pages covered.")
    
    # Recommendations
    summary_parts.append(f"\nRecommendations for next month:")
    summary_parts.append(f"• Continue the current pace of memorization")
    summary_parts.append(f"• Maintain regular revision schedule")
    summary_parts.append(f"• Focus on quality over quantity")
    summary_parts.append(f"• Practice with proper tajweed")
    
    # Encouragement
    summary_parts.append(f"\nKeep up the excellent work, {student_name}! Your dedication to memorizing the Quran is commendable.")
    summary_parts.append(f"May Allah bless your efforts and make this journey easy for you. Ameen.")
    
    return "\n".join(summary_parts)