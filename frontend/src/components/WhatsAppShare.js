import React, { useState } from 'react';
import api from '../services/api';

// WhatsApp icon component (fallback if react-icons fails)
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

const WhatsAppShare = ({ studentId, studentName, weekStart }) => {
  const [show, setShow] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [messagePreview, setMessagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setPhoneNumber('');
    setWhatsappLink('');
    setMessagePreview('');
    setError('');
  };

  const generateWhatsAppLink = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/whatsapp/weekly/${studentId}/whatsapp-link`, {
        params: {
          week_start: weekStart,
          phone_number: phoneNumber
        }
      });

      setWhatsappLink(response.data.whatsapp_link);
      setMessagePreview(response.data.message_preview);
    } catch (err) {
      setError('Failed to generate WhatsApp link. Please try again.');
      console.error('Error generating WhatsApp link:', err);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    }
  };

  const copyToClipboard = () => {
    if (whatsappLink) {
      navigator.clipboard.writeText(whatsappLink);
      alert('WhatsApp link copied to clipboard!');
    }
  };

  return (
    <>
      <button 
        className="btn btn-success d-flex align-items-center gap-2"
        onClick={handleShow}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <WhatsAppIcon /> Share via WhatsApp
      </button>

      {show && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '10px'
            }}>
              <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WhatsAppIcon style={{ color: '#25D366' }} />
                Share Weekly Report via WhatsApp
              </h5>
              <button 
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <h6>Student: {studentName}</h6>
                <p style={{ color: '#6c757d', margin: 0 }}>Week of: {weekStart}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter phone number with country code (e.g., +1234567890)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#6c757d' }}>
                  Include country code (e.g., +1 for US, +44 for UK)
                </small>
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  border: '1px solid #f5c6cb'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={generateWhatsAppLink}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: loading ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Generating...' : 'Generate WhatsApp Link'}
                </button>
              </div>

              {whatsappLink && (
                <div>
                  <h6>Message Preview:</h6>
                  <div style={{
                    border: '1px solid #dee2e6',
                    padding: '15px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    marginBottom: '20px'
                  }}>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.9em',
                      margin: 0,
                      fontFamily: 'inherit'
                    }}>
                      {messagePreview}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-success"
                      onClick={openWhatsApp}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        backgroundColor: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <WhatsAppIcon /> Open in WhatsApp
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={copyToClipboard}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: 'transparent',
                        color: '#6c757d',
                        border: '1px solid #6c757d',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{
              marginTop: '20px',
              paddingTop: '10px',
              borderTop: '1px solid #dee2e6',
              textAlign: 'right'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppShare;
