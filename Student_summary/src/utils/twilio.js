// Get the API base URL from environment or use relative URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const sendVerificationSMS = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send verification SMS');
    }

    return {
      success: true,
      data: await response.json()
    };
  } catch (error) {
    console.error('Error sending verification SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const verifyCode = async (phoneNumber, code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber, code })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify code');
    }

    return {
      success: true,
      data: await response.json()
    };
  } catch (error) {
    console.error('Error verifying code:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 