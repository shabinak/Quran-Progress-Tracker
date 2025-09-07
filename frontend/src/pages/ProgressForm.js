import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { progressAPI, studentsAPI } from '../services/api';
import SurahAyahSelector from '../components/SurahAyahSelector';
import TeacherReview from '../components/TeacherReview';

const ProgressForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student_id: studentId || '',
    week_start: '',
    new_memorization: '',
    recent_revision: '',
    old_revision: '',
    teacher_notes: '',
    new_memorization_teacher: '',
    recent_revision_teacher: '',
    old_revision_teacher: '',
    
    // Teacher review fields
    new_memorization_fluency: '',
    recent_revision_fluency: '',
    old_revision_fluency: '',
    
    new_memorization_tajweed: '',
    recent_revision_tajweed: '',
    old_revision_tajweed: '',
    
    new_memorization_accuracy: '',
    recent_revision_accuracy: '',
    old_revision_accuracy: '',
    
    new_memorization_confidence: '',
    recent_revision_confidence: '',
    old_revision_confidence: ''
  });
  const [loading, setLoading] = useState(false);

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('progressFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          student_id: studentId || parsedData.student_id || ''
        }));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    } else if (studentId) {
      setFormData(prev => ({ ...prev, student_id: studentId }));
    }
    fetchStudents();
  }, [studentId]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData.student_id || formData.week_start || formData.new_memorization || 
        formData.recent_revision || formData.old_revision || formData.teacher_notes) {
      localStorage.setItem('progressFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students');
      console.error('Error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const clearForm = () => {
    setFormData({
      student_id: studentId || '',
      week_start: '',
      new_memorization: '',
      recent_revision: '',
      old_revision: '',
      teacher_notes: '',
      new_memorization_teacher: '',
      recent_revision_teacher: '',
      old_revision_teacher: '',
      
      // Teacher review fields
      new_memorization_fluency: '',
      recent_revision_fluency: '',
      old_revision_fluency: '',
      
      new_memorization_tajweed: '',
      recent_revision_tajweed: '',
      old_revision_tajweed: '',
      
      new_memorization_accuracy: '',
      recent_revision_accuracy: '',
      old_revision_accuracy: '',
      
      new_memorization_confidence: '',
      recent_revision_confidence: '',
      old_revision_confidence: ''
    });
    localStorage.removeItem('progressFormData');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await progressAPI.create(formData);
      toast.success('Progress entry created successfully');
      // Clear saved form data after successful submission
      clearForm();
      navigate(`/progress/${formData.student_id}`);
    } catch (error) {
      toast.error('Error creating progress entry');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    navigate('/progress');
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Weekly Progress</h1>
          <p className="page-subtitle">Record new memorization and revision progress</p>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          Progress Entry Form
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="student_id">Student *</label>
              <select
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                required
                disabled={Boolean(studentId)}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.class_day})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="week_start">Week Start Date *</label>
              <input
                type="date"
                id="week_start"
                name="week_start"
                value={formData.week_start}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <SurahAyahSelector
                label="New Memorization"
                value={formData.new_memorization}
                onChange={(value) => setFormData(prev => ({ ...prev, new_memorization: value }))}
                placeholder="Select new memorization range"
              />
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label htmlFor="new_memorization_teacher">Teacher/Listener for New Memorization</label>
                <input
                  type="text"
                  id="new_memorization_teacher"
                  name="new_memorization_teacher"
                  value={formData.new_memorization_teacher}
                  onChange={handleChange}
                  placeholder="Enter teacher or listener name"
                />
              </div>
              
              <TeacherReview
                label="New Memorization Review"
                fluency={formData.new_memorization_fluency}
                tajweed={formData.new_memorization_tajweed}
                accuracy={formData.new_memorization_accuracy}
                confidence={formData.new_memorization_confidence}
                onFluencyChange={(e) => setFormData(prev => ({ ...prev, new_memorization_fluency: e.target.value }))}
                onTajweedChange={(e) => setFormData(prev => ({ ...prev, new_memorization_tajweed: e.target.value }))}
                onAccuracyChange={(e) => setFormData(prev => ({ ...prev, new_memorization_accuracy: e.target.value }))}
                onConfidenceChange={(e) => setFormData(prev => ({ ...prev, new_memorization_confidence: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <SurahAyahSelector
                label="Recent Revision"
                value={formData.recent_revision}
                onChange={(value) => setFormData(prev => ({ ...prev, recent_revision: value }))}
                placeholder="Select recent revision range"
              />
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label htmlFor="recent_revision_teacher">Teacher/Listener for Recent Revision</label>
                <input
                  type="text"
                  id="recent_revision_teacher"
                  name="recent_revision_teacher"
                  value={formData.recent_revision_teacher}
                  onChange={handleChange}
                  placeholder="Enter teacher or listener name"
                />
              </div>
              
              <TeacherReview
                label="Recent Revision Review"
                fluency={formData.recent_revision_fluency}
                tajweed={formData.recent_revision_tajweed}
                accuracy={formData.recent_revision_accuracy}
                confidence={formData.recent_revision_confidence}
                onFluencyChange={(e) => setFormData(prev => ({ ...prev, recent_revision_fluency: e.target.value }))}
                onTajweedChange={(e) => setFormData(prev => ({ ...prev, recent_revision_tajweed: e.target.value }))}
                onAccuracyChange={(e) => setFormData(prev => ({ ...prev, recent_revision_accuracy: e.target.value }))}
                onConfidenceChange={(e) => setFormData(prev => ({ ...prev, recent_revision_confidence: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <SurahAyahSelector
                label="Old Revision"
                value={formData.old_revision}
                onChange={(value) => setFormData(prev => ({ ...prev, old_revision: value }))}
                placeholder="Select old revision range"
              />
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label htmlFor="old_revision_teacher">Teacher/Listener for Old Revision</label>
                <input
                  type="text"
                  id="old_revision_teacher"
                  name="old_revision_teacher"
                  value={formData.old_revision_teacher}
                  onChange={handleChange}
                  placeholder="Enter teacher or listener name"
                />
              </div>
              
              <TeacherReview
                label="Old Revision Review"
                fluency={formData.old_revision_fluency}
                tajweed={formData.old_revision_tajweed}
                accuracy={formData.old_revision_accuracy}
                confidence={formData.old_revision_confidence}
                onFluencyChange={(e) => setFormData(prev => ({ ...prev, old_revision_fluency: e.target.value }))}
                onTajweedChange={(e) => setFormData(prev => ({ ...prev, old_revision_tajweed: e.target.value }))}
                onAccuracyChange={(e) => setFormData(prev => ({ ...prev, old_revision_accuracy: e.target.value }))}
                onConfidenceChange={(e) => setFormData(prev => ({ ...prev, old_revision_confidence: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="teacher_notes">Teacher Notes</label>
              <textarea
                id="teacher_notes"
                name="teacher_notes"
                value={formData.teacher_notes}
                onChange={handleChange}
                placeholder="e.g., Good fluency, needs more practice with tajweed"
              />
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? '💾 Saving...' : '💾 Save Progress'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearForm}
                disabled={loading}
              >
                🗑️ Clear Form
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                ← Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProgressForm;
