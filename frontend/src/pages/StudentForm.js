import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentsAPI } from '../services/api';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    class_day: ''
  });
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      fetchStudent();
    }
  }, [id, isEdit]);

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.getById(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Error fetching student');
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
      if (isEdit) {
        await studentsAPI.update(id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentsAPI.create(formData);
        toast.success('Student created successfully');
      }
      navigate('/students');
    } catch (error) {
      toast.error(`Error ${isEdit ? 'updating' : 'creating'} student`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Student Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="class_day">Class Day *</label>
            <select
              id="class_day"
              name="class_day"
              value={formData.class_day}
              onChange={handleChange}
              required
            >
              <option value="">Select a day</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Student' : 'Create Student')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/students')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
