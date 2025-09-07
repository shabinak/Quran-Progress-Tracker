import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentsAPI } from '../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await studentsAPI.delete(id);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Error deleting student');
        console.error('Error:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage your students and their progress</p>
        </div>
        <Link to="/students/new" className="btn btn-success">
          ➕ Add New Student
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No Students Found</div>
            <div className="empty-state-description">
              Start by adding your first student to begin tracking their memorization progress.
            </div>
            <Link to="/students/new" className="btn btn-success">
              ➕ Add Your First Student
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            Students ({students.length})
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class Day</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>👤</span>
                        <span style={{ fontWeight: '600' }}>{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-badge status-badge-success">
                        {student.class_day}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/students/${student.id}/edit`} className="btn btn-secondary">
                          ✏️ Edit
                        </Link>
                        <Link to={`/progress/new?studentId=${student.id}`} className="btn">
                          ➕ Progress
                        </Link>
                        <Link to={`/progress/${student.id}`} className="btn btn-success">
                          📊 View
                        </Link>
                        <Link to={`/summaries/weekly/${student.id}`} className="btn">
                          📅 Weekly
                        </Link>
                        <Link to={`/summaries/monthly/${student.id}`} className="btn">
                          🗓️ Monthly
                        </Link>
                        <Link to={`/reports/${student.id}`} className="btn">
                          📈 Reports
                        </Link>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
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

export default StudentList;
