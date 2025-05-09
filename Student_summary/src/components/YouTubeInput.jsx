import React, { useState } from 'react';
import API_BASE_URL from '../config';

function YouTubeInput() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Sending request with URL:', url);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/process-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: url, outputType: 'summary' })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccess(true);
        // Handle successful processing (e.g., show summary)
      } else {
        setError(data.message || 'Error processing video');
      }
    } catch (error) {
      setError('Error processing YouTube video');
      console.error('Processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="youtube-input-container">
      <h3>הכנס קישור ליוטיוב</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="הדבק קישור ליוטיוב כאן"
          className="youtube-url-input"
        />
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Video processed successfully!</div>}
        <button 
          type="submit" 
          disabled={!url || loading}
          className={`submit-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'מעבד...' : 'עבד סרטון'}
        </button>
      </form>
    </div>
  );
}

export default YouTubeInput; 