# Hifz Hub

A comprehensive digital platform for teachers to track Quran memorization and revision progress of students with interactive testing, audio recording, and automated report generation.

## Features

- **Interactive Memorization Testing**: Test students with random ayahs by Surah or Juz
- **Audio Recording & Playback**: Students can record their recitation for self-assessment
- **Student Management**: Add and manage students with comprehensive profiles
- **Progress Tracking**: Visual analytics and detailed progress monitoring
- **Automated Reports**: Generate beautiful PDF reports with natural language summaries
- **Modern UI**: Beautiful, responsive design with glassmorphism effects

## Tech Stack

- **Backend**: Python FastAPI
- **Database**: SQLite
- **Frontend**: React (POC)
- **LLM Integration**: OpenAI API (ChatGPT)
- **Reporting**: ReportLab for PDF generation

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env and add your OpenAI API key
```

3. Run the backend:
```bash
python main.py
```

4. Run the frontend (optional):
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /students` - List all students
- `POST /students` - Create a new student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student
- `POST /progress` - Add weekly progress
- `GET /progress/{student_id}` - Get student progress
- `GET /summary/weekly/{student_id}` - Get weekly summary
- `GET /summary/monthly/{student_id}` - Get monthly summary
- `GET /reports/weekly/{student_id}` - Download weekly PDF report
- `GET /reports/monthly/{student_id}` - Download monthly PDF report

## Database Schema

### Students Table
- id (integer, primary key)
- name (text)
- class_day (text)

### Progress Table
- id (integer, primary key)
- student_id (integer, foreign key)
- week_start (date)
- new_memorization (text)
- recent_revision (text)
- old_revision (text)
- teacher_notes (text)