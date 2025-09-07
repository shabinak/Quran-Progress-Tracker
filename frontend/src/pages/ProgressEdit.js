import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { progressAPI, studentsAPI } from '../services/api';
import SurahAyahSelector from '../components/SurahAyahSelector';
import TeacherReview from '../components/TeacherReview';

const ProgressEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [id]);

  const fetchProgress = async () => {
    try {
      const response = await progressAPI.getById(id);
      const progressData = response.data;
      
      setFormData({
        week_start: progressData.week_start,
        new_memorization: progressData.new_memorization || '',
        recent_revision: progressData.recent_revision || '',
        old_revision: progressData.old_revision || '',
        teacher_notes: progressData.teacher_notes || '',
        new_memorization_teacher: progressData.new_memorization_teacher || '',
        recent_revision_teacher: progressData.recent_revision_teacher || '',
        old_revision_teacher: progressData.old_revision_teacher || '',
        
        // Teacher review fields
        new_memorization_fluency: progressData.new_memorization_fluency || '',
        recent_revision_fluency: progressData.recent_revision_fluency || '',
        old_revision_fluency: progressData.old_revision_fluency || '',
        
        new_memorization_tajweed: progressData.new_memorization_tajweed || '',
        recent_revision_tajweed: progressData.recent_revision_tajweed || '',
        old_revision_tajweed: progressData.old_revision_tajweed || '',
        
        new_memorization_accuracy: progressData.new_memorization_accuracy || '',
        recent_revision_accuracy: progressData.recent_revision_accuracy || '',
        old_revision_accuracy: progressData.old_revision_accuracy || '',
        
        new_memorization_confidence: progressData.new_memorization_confidence || '',
        recent_revision_confidence: progressData.recent_revision_confidence || '',
        old_revision_confidence: progressData.old_revision_confidence || ''
      });

      // Fetch student information
      const studentResponse = await studentsAPI.getById(progressData.student_id);
      setStudent(studentResponse.data);
    } catch (error) {
      toast.error('Error fetching progress entry');
      console.error('Error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await progressAPI.update(id, formData);
      toast.success('Progress entry updated successfully');
      navigate(`/progress/${student.id}`);
    } catch (error) {
      toast.error('Error updating progress entry');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return <div className="loading">Loading progress entry...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Progress Entry - {student.name}</h1>
          <p className="page-subtitle">Update memorization and revision progress</p>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          Progress Entry Form
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
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
                {loading ? '💾 Updating...' : '💾 Update Progress'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/progress/${student.id}`)}
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

export default ProgressEdit;
