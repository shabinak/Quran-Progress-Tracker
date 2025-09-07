import React from 'react';

const TeacherReview = ({ 
  label, 
  fluency, 
  tajweed, 
  accuracy, 
  confidence, 
  onFluencyChange, 
  onTajweedChange, 
  onAccuracyChange, 
  onConfidenceChange,
  required = false 
}) => {
  const ratingOptions = [
    { value: '', label: 'Select Rating' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Needs Review', label: 'Needs Review' },
    { value: 'Poor', label: 'Poor' }
  ];

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Excellent': return '#10B981'; // Green
      case 'Good': return '#3B82F6'; // Blue
      case 'Fair': return '#F59E0B'; // Yellow
      case 'Needs Review': return '#F97316'; // Orange
      case 'Poor': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const RatingSelect = ({ value, onChange, label, required }) => (
    <div className="rating-select">
      <label className="rating-label">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="rating-dropdown"
        required={required}
        style={{ borderColor: getRatingColor(value) }}
      >
        {ratingOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value && (
        <div 
          className="rating-indicator"
          style={{ backgroundColor: getRatingColor(value) }}
        />
      )}
    </div>
  );

  return (
    <div className="teacher-review-container">
      <h4 className="review-section-title">{label}</h4>
      <div className="rating-grid">
        <RatingSelect
          value={fluency}
          onChange={onFluencyChange}
          label="Fluency"
          required={required}
        />
        <RatingSelect
          value={tajweed}
          onChange={onTajweedChange}
          label="Tajweed"
          required={required}
        />
        <RatingSelect
          value={accuracy}
          onChange={onAccuracyChange}
          label="Accuracy"
          required={required}
        />
        <RatingSelect
          value={confidence}
          onChange={onConfidenceChange}
          label="Confidence"
          required={required}
        />
      </div>
    </div>
  );
};

export default TeacherReview;
