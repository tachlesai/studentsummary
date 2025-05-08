import React, { useState } from 'react';
import '../styles/SignUp.css';
import { useNavigate } from 'react-router-dom';
import '../styles/SignUp.css';
import API_BASE_URL from '../config';
import { sendVerificationSMS, verifyCode } from '../utils/twilio';
import { setUser, setToken } from '../utils/auth';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: Basic info, 2: Phone verification
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPhoneNumber = (input) => {
    // Remove all non-digit characters
    let digits = input.replace(/\D/g, '');
    // If starts with 0, replace with +972
    if (digits.startsWith('0')) {
      digits = '+972' + digits.slice(1);
    } else if (!digits.startsWith('+')) {
      digits = '+' + digits;
    }
    return digits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always format the phone number before using it
      const formattedPhoneNumber = formatPhoneNumber(formData.phoneNumber);
      if (step === 1) {
        // Check if user already exists by email or phone number
        const checkRes = await fetch(`${API_BASE_URL}/check-user-exists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, phoneNumber: formattedPhoneNumber })
        });
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setError('אימייל או מספר טלפון זה כבר בשימוש.');
          setLoading(false);
          return;
        }
        // Send verification SMS
        const response = await sendVerificationSMS(formattedPhoneNumber);
        if (response.success) {
          setStep(2);
        } else {
          setError('Failed to send verification SMS. Please try again.');
        }
      } else {
        // Verify the code
        const verificationResponse = await verifyCode(formattedPhoneNumber, verificationCode);
        if (verificationResponse.success) {
          // Proceed with registration
          const registerResponse = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...formData, phoneNumber: formattedPhoneNumber })
          });

          const data = await registerResponse.json();
          if (!registerResponse.ok) {
            // Show backend error message if available
            setError(data.message || 'Registration failed');
            setLoading(false);
            return;
          }
          setUser(data.user);
          setToken(data.token);
          navigate('/dashboard');
        } else {
          setError('Invalid verification code. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ alignItems: 'center' }}>
      <div style={{ maxWidth: '900px', width: '100%' }}>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          צור חשבון חדש
        </h2>
      </div>

      <div className="mt-8" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="bg-white py-12 px-8 shadow sm:rounded-lg sm:px-16" style={{ maxWidth: '900px', width: '100%' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 text-right">
                    שם פרטי
                  </label>
                  <div className="mt-1">
                    <input
                      style={{ direction: 'rtl' }}
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 text-right">
                    שם משפחה
                  </label>
                  <div className="mt-1">
                    <input
                      style={{ direction: 'rtl' }}
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-right">
                    אימייל
                  </label>
                  <div className="mt-1">
                    <input
                      style={{ direction: 'rtl' }}
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-right">
                    סיסמה
                  </label>
                  <div className="mt-1">
                    <input
                      style={{ direction: 'rtl' }}
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 text-right">
                    מספר טלפון
                  </label>
                  <div className="mt-1">
                    <input
                      style={{ direction: 'rtl' }}
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="054-806XXXX"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 text-right">
                  קוד אימות
                </label>
                <div className="mt-1">
                  <input
                    style={{ direction: 'rtl' }}
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  הזן את הקוד שנשלח למספר הטלפון שלך
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'מעבד...' : step === 1 ? 'שלח קוד אימות' : 'הרשמה'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 