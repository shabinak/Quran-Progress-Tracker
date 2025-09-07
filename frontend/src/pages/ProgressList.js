import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { progressAPI, studentsAPI } from '../services/api';
import { format } from 'date-fns';

const ProgressList = () => {
  const { studentId } = useParams();
  const [progressEntries, setProgressEntries] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
      fetchProgress();
    } else {
      fetchAllProgress();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.getById(studentId);
      setStudent(response.data);
    } catch (error) {
      toast.error('Error fetching student');
      console.error('Error:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await progressAPI.getAll(studentId);
      setProgressEntries(response.data);
    } catch (error) {
      toast.error('Error fetching progress');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProgress = async () => {
    try {
      // For now, we'll show a message to select a student
      // In a real app, you might want to show all progress entries
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching progress');
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this progress entry?')) {
      try {
        await progressAPI.delete(id);
        toast.success('Progress entry deleted successfully');
        if (studentId) {
          fetchProgress();
        } else {
          fetchAllProgress();
        }
      } catch (error) {
        toast.error('Error deleting progress entry');
        console.error('Error:', error);
      }
    }
  };

  const formatMemorizationDisplay = (text) => {
    if (!text) return '-';
    
    // If it's already in the new format, return as is
    if (text.includes('Ayah') || text.includes(',')) {
      return text;
    }
    
    // Try to parse old format and convert
    const surahMatch = text.match(/^(.+?)\s+(\d+)-(\d+)$/);
    if (surahMatch) {
      const [, surahName, start, end] = surahMatch;
      return `${surahName} ${start}-${end}`;
    }
    
    return text;
  };

  if (loading) {
    return <div className="loading">Loading progress...</div>;
  }

  if (!studentId) {
    return (
      <div>
        <h2>Progress Entries</h2>
        <div className="card">
          <p>Please select a student to view their progress entries.</p>
          <Link to="/students" className="btn">View Students</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress for {student?.name}</h1>
          <p className="page-subtitle">Track and manage memorization progress</p>
        </div>
        <Link to={`/progress/new?studentId=${studentId}`} className="btn btn-success">
          ➕ Add Progress
        </Link>
      </div>

      {progressEntries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Progress Entries</div>
            <div className="empty-state-description">
              Start tracking progress by adding the first entry for this student.
            </div>
            <Link to={`/progress/new?studentId=${studentId}`} className="btn btn-success">
              ➕ Add First Progress Entry
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            Progress Entries ({progressEntries.length})
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Week Start</th>
                  <th>New Memorization</th>
                  <th>Recent Revision</th>
                  <th>Old Revision</th>
                  <th>Teachers/Listeners</th>
                  <th>Teacher Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {progressEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="status-badge status-badge-success">
                        {format(new Date(entry.week_start), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td style={{ minWidth: '150px' }}>{formatMemorizationDisplay(entry.new_memorization)}</td>
                    <td style={{ minWidth: '150px' }}>{formatMemorizationDisplay(entry.recent_revision)}</td>
                    <td style={{ minWidth: '150px' }}>{formatMemorizationDisplay(entry.old_revision)}</td>
                    <td style={{ minWidth: '200px' }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        {entry.new_memorization_teacher && (
                          <div><strong>New:</strong> {entry.new_memorization_teacher}</div>
                        )}
                        {entry.recent_revision_teacher && (
                          <div><strong>Recent:</strong> {entry.recent_revision_teacher}</div>
                        )}
                        {entry.old_revision_teacher && (
                          <div><strong>Old:</strong> {entry.old_revision_teacher}</div>
                        )}
                        {!entry.new_memorization_teacher && !entry.recent_revision_teacher && !entry.old_revision_teacher && (
                          <span style={{ color: '#6B7280' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td>{entry.teacher_notes || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/progress/${entry.id}/edit`} className="btn btn-secondary">
                          ✏️ Edit
                        </Link>
                        <Link to={`/summaries/weekly/${studentId}?week_start=${entry.week_start}`} className="btn">
                          📊 Summary
                        </Link>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="btn btn-danger"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressList;
