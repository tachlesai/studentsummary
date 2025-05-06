import React from 'react';

const RecordingsPage = () => {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>הקלטות</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {/* כרטיס הקלטה */}
        <div style={{ border: '1px solid #007bff', borderRadius: '12px', padding: '20px', width: '80%', maxWidth: '600px', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ color: '#007bff' }}>הקלטה 1</h2>
          <p style={{ marginBottom: '10px' }}>תאריך: 01/01/2023</p>
          <p style={{ marginBottom: '20px' }}>תיאור: הקלטה זו עוסקת בנושא חשוב מאוד.</p>
          <audio controls style={{ width: '100%' }}>
            <source src="path/to/recording1.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>

        {/* כרטיס הקלטה נוסף */}
        <div style={{ border: '1px solid #007bff', borderRadius: '12px', padding: '20px', width: '80%', maxWidth: '600px', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ color: '#007bff' }}>הקלטה 2</h2>
          <p style={{ marginBottom: '10px' }}>תאריך: 02/01/2023</p>
          <p style={{ marginBottom: '20px' }}>תיאור: הקלטה זו עוסקת בנושא נוסף.</p>
          <audio controls style={{ width: '100%' }}>
            <source src="path/to/recording2.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  );
};

export default RecordingsPage;