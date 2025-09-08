import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reportsAPI, studentsAPI } from '../services/api';
import { format } from 'date-fns';
import WhatsAppShare from '../components/WhatsAppShare';

const Reports = () => {
  const { studentId } = useParams();
  const [reports, setReports] = useState([]);
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

  const fetchReports = useCallback(async () => {
    try {
      const response = await reportsAPI.list(studentId);
      setReports(response.data.reports);
    } catch (error) {
      toast.error('Error fetching reports');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
    fetchReports();
  }, [fetchStudent, fetchReports]);

  const downloadReport = async (filename, type) => {
    try {
      let response;
      if (type === 'weekly') {
        response = await reportsAPI.downloadWeekly(studentId);
      } else {
        response = await reportsAPI.downloadMonthly(studentId);
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
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

  const generateNewReport = async (type) => {
    try {
      if (type === 'weekly') {
        await reportsAPI.downloadWeekly(studentId);
        toast.success('Weekly report generated and downloaded');
      } else {
        await reportsAPI.downloadMonthly(studentId);
        toast.success('Monthly report generated and downloaded');
      }
      fetchReports(); // Refresh the list
    } catch (error) {
      toast.error(`Error generating ${type} report`);
      console.error('Error:', error);
    }
  };


  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Reports - {student?.name || 'Loading...'}</h2>
        <div>
          <button 
            onClick={() => generateNewReport('weekly')} 
            className="btn btn-success"
            style={{ marginRight: '10px' }}
          >
            Generate Weekly Report
          </button>
          <button 
            onClick={() => generateNewReport('monthly')} 
            className="btn btn-success"
          >
            Generate Monthly Report
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Available Reports</h3>
        
        {reports.length === 0 ? (
          <p>No reports available. Generate a new report to get started.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>Created</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index}>
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
                        // Check if date is valid and not too far in the future
                        if (isNaN(date.getTime()) || date.getFullYear() > 2030) {
                          return 'Unknown date';
                        }
                        return format(date, 'MMM dd, yyyy HH:mm');
                      } catch (error) {
                        return 'Unknown date';
                      }
                    })()}
                  </td>
                  <td>{(report.size / 1024).toFixed(1)} KB</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <WhatsAppShare 
                        studentId={studentId} 
                        studentName={student?.name} 
                        weekStart={report.week_start} 
                      />
                      <button
                        onClick={() => downloadReport(report.filename, report.type)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <Link to="/reports" className="btn btn-secondary">
          All Reports
        </Link>
        <Link to={`/progress/${studentId}`} className="btn btn-secondary">
          Back to Progress
        </Link>
        <Link to={`/summaries/weekly/${studentId}`} className="btn">
          Weekly Summary
        </Link>
        <Link to={`/summaries/monthly/${studentId}`} className="btn">
          Monthly Summary
        </Link>
      </div>
    </div>
  );
};

export default Reports;
