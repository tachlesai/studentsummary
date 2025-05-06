// Twilio Account Credentials
const TWILIO_ACCOUNT_SID = 'ACb4be8928129a2139f4591a1ad9aa06ba'; // Your Twilio Account SID
const TWILIO_AUTH_TOKEN = '91112a6b8e51af2cbbad3dab41f6740e'; // Your Twilio Auth Token (get this from Twilio Console)
const VERIFY_SERVICE_SID = 'VA1e8a0d0ba74244c6e4129cb7ccefb908'; // Your Verify Service SID

export const sendVerificationSMS = async (phoneNumber) => {
  try {
    const response = await fetch('https://verify.twilio.com/v2/Services/VA1e8a0d0ba74244c6e4129cb7ccefb908/Verifications', {
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