import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { summariesAPI, studentsAPI, reportsAPI } from '../services/api';
import { format } from 'date-fns';
import WhatsAppShare from '../components/WhatsAppShare';

const WeeklySummary = () => {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const weekStart = searchParams.get('week_start');
  
  const [summary, setSummary] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async () => {
    try {
      const response = await studentsAPI.getById(studentId);
      setStudent(response.data);
    } catch (error) {
      toast.error('Error fetching student');
      console.error('Error:', error);
    }
  }, [studentId]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await summariesAPI.getWeekly(studentId, weekStart);
      setSummary(response.data);
    } catch (error) {
      toast.error('Error fetching weekly summary');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, weekStart]);

  useEffect(() => {
    fetchStudent();
    fetchSummary();
  }, [fetchStudent, fetchSummary]);

  const downloadReport = async () => {
    try {
      const response = await reportsAPI.downloadWeekly(studentId, weekStart);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly_${student?.name}_${summary?.week_start}.pdf`;
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
    return <div className="loading">Loading weekly summary...</div>;
  }

  if (!summary) {
    return (
      <div>
        <h2>Weekly Summary</h2>
        <div className="card">
          <p>No summary available for this week.</p>
          <Link to={`/progress/${studentId}`} className="btn">View Progress</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Weekly Summary - {student?.name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <WhatsAppShare 
            studentId={studentId} 
            studentName={student?.name} 
            weekStart={weekStart} 
          />
          <button onClick={downloadReport} className="btn btn-success">
            Download PDF
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Week of {format(new Date(summary.week_start), 'MMMM dd, yyyy')}</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Statistics</h4>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <strong>New Ayahs Memorized:</strong> {summary.new_ayahs_count}
            </div>
            <div>
              <strong>Revision Pages Covered:</strong> {summary.revision_pages_count}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Progress Details</h4>
          <table className="table">
            <tbody>
              <tr>
                <td><strong>New Memorization:</strong></td>
                <td>{summary.current_week.new_memorization || '-'}</td>
              </tr>
              <tr>
                <td><strong>Recent Revision:</strong></td>
                <td>{summary.current_week.recent_revision || '-'}</td>
              </tr>
              <tr>
                <td><strong>Old Revision:</strong></td>
                <td>{summary.current_week.old_revision || '-'}</td>
              </tr>
              <tr>
                <td><strong>Teacher Notes:</strong></td>
                <td>{summary.current_week.teacher_notes || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {summary.previous_week && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Previous Week Comparison</h4>
            <table className="table">
              <tbody>
                <tr>
                  <td><strong>Previous Week New Memorization:</strong></td>
                  <td>{summary.previous_week.new_memorization || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Previous Week Recent Revision:</strong></td>
                  <td>{summary.previous_week.recent_revision || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Previous Week Old Revision:</strong></td>
                  <td>{summary.previous_week.old_revision || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div>
          <h4>Teacher's Summary</h4>
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
        <Link to={`/summaries/monthly/${studentId}`} className="btn">
          Monthly Summary
        </Link>
      </div>
    </div>
  );
};

export default WeeklySummary;
