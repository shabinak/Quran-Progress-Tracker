import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentsAPI, reportsAPI } from '../services/api';

const AllReports = () => {
  const [students, setStudents] = useState([]);
  const [reportsData, setReportsData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students');
      console.error('Error:', error);
    }
  }, []);

  const fetchAllReports = useCallback(async () => {
    try {
      const reportsPromises = students.map(student => 
        reportsAPI.list(student.id).then(response => ({
          studentId: student.id,
          studentName: student.name,
          reports: response.data.reports
        })).catch(error => {
          console.error(`Error fetching reports for student ${student.id}:`, error);
          return {
            studentId: student.id,
            studentName: student.name,
            reports: []
          };
        })
      );

      const allReports = await Promise.all(reportsPromises);
      const reportsMap = {};
      allReports.forEach(({ studentId, studentName, reports }) => {
        reportsMap[studentId] = { studentName, reports };
      });
      
      setReportsData(reportsMap);
    } catch (error) {
      toast.error('Error fetching reports');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [students]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (students.length > 0) {
      fetchAllReports();
    }
  }, [students, fetchAllReports]);

  const getTotalReports = () => {
    return Object.values(reportsData).reduce((total, { reports }) => total + reports.length, 0);
  };

  const getRecentReports = () => {
    const allReports = [];
    Object.entries(reportsData).forEach(([studentId, { studentName, reports }]) => {
      reports.forEach(report => {
        allReports.push({
          ...report,
          studentId: parseInt(studentId),
          studentName
        });
      });
    });
    
    return allReports
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5);
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>All Reports</h2>
        <div>
          <Link to="/students" className="btn btn-secondary">
            Manage Students
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-purple)', margin: '0 0 0.5rem 0' }}>
            {students.length}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>Total Students</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-purple)', margin: '0 0 0.5rem 0' }}>
            {getTotalReports()}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>Total Reports</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-purple)', margin: '0 0 0.5rem 0' }}>
            {Object.values(reportsData).filter(({ reports }) => reports.length > 0).length}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>Students with Reports</p>
        </div>
      </div>

      {/* Recent Reports */}
      {getRecentReports().length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Recent Reports</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Report</th>
                <th>Type</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getRecentReports().map((report, index) => (
                <tr key={index}>
                  <td>
                    <Link to={`/reports/${report.studentId}`} style={{ color: 'var(--primary-purple)', textDecoration: 'none' }}>
                      {report.studentName}
                    </Link>
                  </td>
                  <td>{report.filename}</td>
                  <td>
                    <span style={{
                      backgroundColor: report.type === 'weekly' ? '#007bff' : '#28a745',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {report.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      try {
                        const date = new Date(report.created_at * 1000);
                        if (isNaN(date.getTime()) || date.getFullYear() > 2030) {
                          return 'Unknown date';
                        }
                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch (error) {
                        return 'Unknown date';
                      }
                    })()}
                  </td>
                  <td>
                    <Link to={`/reports/${report.studentId}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                      View All Reports
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Students List */}
      <div className="card">
        <h3>Students & Their Reports</h3>
        
        {students.length === 0 ? (
          <p>No students found. <Link to="/students/new">Add a student</Link> to get started.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {students.map(student => {
              const studentReports = reportsData[student.id] || { studentName: student.name, reports: [] };
              const reportCount = studentReports.reports.length;
              
              return (
                <div key={student.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>
                        {student.name}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        Class Day: {student.class_day}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        {reportCount} report{reportCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {reportCount > 0 && (
                        <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            Latest Report
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                            {studentReports.reports[0]?.filename || 'N/A'}
                          </p>
                        </div>
                      )}
                      
                      <Link 
                        to={`/reports/${student.id}`} 
                        className="btn btn-primary"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                      >
                        {reportCount > 0 ? 'View Reports' : 'Generate Report'}
                      </Link>
                    </div>
                  </div>
                  
                  {reportCount > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {studentReports.reports.slice(0, 3).map((report, index) => (
                          <span 
                            key={index}
                            style={{
                              backgroundColor: report.type === 'weekly' ? '#e3f2fd' : '#e8f5e8',
                              color: report.type === 'weekly' ? '#1976d2' : '#2e7d32',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              border: `1px solid ${report.type === 'weekly' ? '#bbdefb' : '#c8e6c9'}`
                            }}
                          >
                            {report.type.toUpperCase()}
                          </span>
                        ))}
                        {reportCount > 3 && (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', alignSelf: 'center' }}>
                            +{reportCount - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllReports;
