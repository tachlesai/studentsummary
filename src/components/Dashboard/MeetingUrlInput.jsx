import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';

const MeetingUrlInput = () => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!meetingUrl) {
      setNotification({
        open: true,
        message: 'אנא הזן קישור לפגישה',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call instead of real axios request
      console.log('Meeting URL submitted:', meetingUrl);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotification({
        open: true,
        message: 'הקישור נשלח בהצלחה (מצב בדיקה)',
        severity: 'success'
      });
      
      setMeetingUrl('');
    } catch (error) {
      console.error('Error sending meeting URL:', error);
      
      setNotification({
        open: true,
        message: 'אירעה שגיאה בשליחת הקישור',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h6" align="right" gutterBottom>
        הוספת קישור לפגישה/הרצאה
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="הזן קישור לפגישה או הרצאה"
          variant="outlined"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="https://zoom.us/j/example"
          margin="normal"
          dir="rtl"
          InputProps={{
            sx: { textAlign: 'right' }
          }}
          InputLabelProps={{
            sx: { right: 14, left: 'auto', transformOrigin: 'right top' }
          }}
        />
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'שולח...' : 'שלח קישור'}
          </Button>
        </Box>
      </form>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeetingUrlInput;