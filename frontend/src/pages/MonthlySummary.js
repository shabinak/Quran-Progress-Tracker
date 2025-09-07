import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { summariesAPI, studentsAPI, reportsAPI } from '../services/api';
import { format } from 'date-fns';

const MonthlySummary = () => {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const monthStart = searchParams.get('month_start');
  
  const [summary, setSummary] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
    fetchSummary();
  }, [studentId, monthStart]);

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.getById(studentId);
      setStudent(response.data);
    } catch (error) {
      toast.error('Error fetching student');
      console.error('Error:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await summariesAPI.getMonthly(studentId, monthStart);
      setSummary(response.data);
    } catch (error) {
      toast.error('Error fetching monthly summary');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await reportsAPI.downloadMonthly(studentId, monthStart);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly_${student?.name}_${summary?.month_start}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Error downloading report');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading monthly summary...</div>;
  }

  if (!summary) {
    return (
      <div>
        <h2>Monthly Summary</h2>
        <div className="card">
          <p>No summary available for this month.</p>
          <Link to={`/progress/${studentId}`} className="btn">View Progress</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Monthly Summary - {student?.name}</h2>
        <button onClick={downloadReport} className="btn btn-success">
          Download PDF
        </button>
      </div>

      <div className="card">
        <h3>{format(new Date(summary.month_start), 'MMMM yyyy')}</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Monthly Statistics</h4>
          <table className="table">
            <tbody>
              <tr>
                <td><strong>Total New Ayahs Memorized:</strong></td>
                <td>{summary.total_new_ayahs}</td>
              </tr>
              <tr>
                <td><strong>Total Revision Pages Covered:</strong></td>
                <td>{summary.total_revision_pages}</td>
              </tr>
              <tr>
                <td><strong>Weeks of Attendance:</strong></td>
                <td>{summary.attendance_weeks}/4</td>
              </tr>
              <tr>
                <td><strong>Attendance Rate:</strong></td>
                <td>{((summary.attendance_weeks/4)*100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Weekly Breakdown</h4>
          {summary.weekly_breakdown.map((week, index) => (
            <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <h5>Week {index + 1} - {format(new Date(week.week_start), 'MMM dd, yyyy')}</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <td><strong>New Memorization:</strong></td>
                    <td>{week.current_week.new_memorization || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Recent Revision:</strong></td>
                    <td>{week.current_week.recent_revision || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Old Revision:</strong></td>
                    <td>{week.current_week.old_revision || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Teacher Notes:</strong></td>
                    <td>{week.current_week.teacher_notes || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>New Ayahs:</strong></td>
                    <td>{week.new_ayahs_count}</td>
                  </tr>
                  <tr>
                    <td><strong>Revision Pages:</strong></td>
                    <td>{week.revision_pages_count}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '10px' }}>
                <strong>Summary:</strong>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '5px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {week.summary_text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4>Monthly Summary</h4>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            whiteSpace: 'pre-wrap'
          }}>
            {summary.summary_text}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <Link to={`/progress/${studentId}`} className="btn btn-secondary">
          Back to Progress
        </Link>
        <Link to={`/summaries/weekly/${studentId}`} className="btn">
          Weekly Summary
        </Link>
      </div>
    </div>
  );
};

export default MonthlySummary;
