# Quran Memorization Tracker - Setup Guide

This guide will help you set up and run the Quran Memorization Tracker application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** (optional) - [Download Git](https://git-scm.com/downloads)

## Quick Start

### 1. Backend Setup

1. **Navigate to the project directory:**
   ```bash
   cd "Quran Progress Tracker"
   ```

2. **Run the backend setup script:**
   ```bash
   ./start_backend.sh
   ```
   
   This script will:
   - Create a Python virtual environment
   - Install all required dependencies
   - Create a `.env` file from the template
   - Start the FastAPI server

3. **Configure your OpenAI API key:**
   - Edit the `.env` file
   - Add your OpenAI API key: `OPENAI_API_KEY=your_actual_api_key_here`
   - Get an API key from: https://platform.openai.com/api-keys

4. **Restart the backend:**
   ```bash
   ./start_backend.sh
   ```

### 2. Frontend Setup

1. **Open a new terminal and navigate to the project directory:**
   ```bash
   cd "Quran Progress Tracker"
   ```

2. **Run the frontend setup script:**
   ```bash
   ./start_frontend.sh
   ```
   
   This script will:
   - Install all Node.js dependencies
   - Start the React development server

## Manual Setup (Alternative)

If you prefer to set up manually:

### Backend Manual Setup

1. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Start the backend:**
   ```bash
   python main.py
   ```

### Frontend Manual Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## Accessing the Application

- **Frontend (React App):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Features Overview

### 1. Student Management
- Add new students with name and class day
- Edit student information
- Delete students
- View all students

### 2. Progress Tracking
- Add weekly progress entries for each student
- Track new memorization, recent revision, old revision
- Add teacher notes for each week

### 3. AI-Powered Summaries
- **Weekly Summary:** Compare current week with previous week
- **Monthly Summary:** Aggregate 4 weeks of progress
- Natural language feedback using OpenAI GPT

### 4. Report Generation
- Generate PDF reports for weekly and monthly summaries
- Download reports for sharing with parents
- Professional formatting with statistics and AI insights

## API Endpoints

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create a new student
- `GET /api/students/{id}` - Get student by ID
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Progress
- `POST /api/progress` - Create progress entry
- `GET /api/progress/student/{student_id}` - Get student progress
- `GET /api/progress/{id}` - Get progress by ID
- `PUT /api/progress/{id}` - Update progress
- `DELETE /api/progress/{id}` - Delete progress

### Summaries
- `GET /api/summaries/weekly/{student_id}` - Get weekly summary
- `GET /api/summaries/monthly/{student_id}` - Get monthly summary

### Reports
- `GET /api/reports/weekly/{student_id}` - Download weekly PDF
- `GET /api/reports/monthly/{student_id}` - Download monthly PDF
- `GET /api/reports/list/{student_id}` - List available reports

## Database

The application uses SQLite database (`quran_tracker.db`) which is created automatically on first run.

### Database Schema

**Students Table:**
- `id` (Primary Key)
- `name` (Text)
- `class_day` (Text)

**Progress Table:**
- `id` (Primary Key)
- `student_id` (Foreign Key)
- `week_start` (Date)
- `new_memorization` (Text)
- `recent_revision` (Text)
- `old_revision` (Text)
- `teacher_notes` (Text)

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Backend: Change port in `main.py` (line with `uvicorn.run`)
   - Frontend: React will prompt to use a different port

2. **OpenAI API errors:**
   - Ensure your API key is correct in `.env`
   - Check your OpenAI account has sufficient credits

3. **Database errors:**
   - Delete `quran_tracker.db` to reset the database
   - Restart the backend to recreate tables

4. **Frontend not connecting to backend:**
   - Ensure backend is running on port 8000
   - Check CORS settings in `main.py`

### Getting Help

- Check the API documentation at http://localhost:8000/docs
- Review the console logs for error messages
- Ensure all dependencies are installed correctly

## Development

### Project Structure
```
Quran Progress Tracker/
├── main.py                 # FastAPI application entry point
├── database.py             # Database models and connection
├── models.py               # Pydantic models
├── llm_service.py          # OpenAI integration
├── report_generator.py     # PDF generation
├── routers/                # API route handlers
│   ├── students.py
│   ├── progress.py
│   ├── summaries.py
│   └── reports.py
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── requirements.txt        # Python dependencies
├── start_backend.sh        # Backend startup script
├── start_frontend.sh       # Frontend startup script
└── README.md
```

### Adding New Features

1. **Backend:** Add new routes in `routers/` directory
2. **Frontend:** Add new components in `frontend/src/components/`
3. **Database:** Modify models in `database.py` and `models.py`

## License

This project is created as a POC (Proof of Concept) for Quran memorization tracking.
