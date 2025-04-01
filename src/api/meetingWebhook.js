const handleMeetingWebhook = async (req, res) => {
  try {
    const { meetingUrl } = req.body;
    
    if (!meetingUrl) {
      return res.status(400).json({ error: 'Meeting URL is required' });
    }
    
    // Here you would implement the logic to process the meeting URL
    // For example, storing it in a database or forwarding it to another service
    
    console.log('Received meeting URL:', meetingUrl);
    
    // Example: Forward to another webhook or service
    // await axios.post('https://your-external-webhook.com', { meetingUrl });
    
    return res.status(200).json({ success: true, message: 'Meeting URL received successfully' });
  } catch (error) {
    console.error('Error in meeting webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default handleMeetingWebhook;