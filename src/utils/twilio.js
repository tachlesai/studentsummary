// Twilio Account Credentials
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = import.meta.env.VITE_VERIFY_SERVICE_SID;

export const sendVerificationSMS = async (phoneNumber) => {
  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/Verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Channel': 'sms'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send verification SMS');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification SMS:', error);
    return { success: false, error: error.message };
  }
};

export const verifyCode = async (phoneNumber, code) => {
  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/VerificationCheck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Code': code
      })
    });

    if (!response.ok) {
      throw new Error('Failed to verify code');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, error: error.message };
  }
}; 