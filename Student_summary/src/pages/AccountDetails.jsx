import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const AccountDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchUserData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch user details from your backend
        const response = await fetch(`${API_BASE_URL}/account-details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!data.success) {
          setError('שגיאה בטעינת נתוני המשתמש');
          setLoading(false);
          return;
        }
        setUser({
          name: data.name || '',
          email: data.email || '',
          membershipStatus: data.membershipStatus || 'Free',
          receipt: data.receipt || null
        });
        setLoading(false);
      } catch (err) {
        setError('שגיאה בטעינת נתוני המשתמש');
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  if (loading) {
    return <div className="text-center mt-20 text-xl">טוען נתונים...</div>;
  }
  if (error) {
    return <div className="text-center mt-20 text-xl text-red-500">{error}</div>;
  }
  if (!user) {
    return null;
  }

  const isPremium = user.membershipStatus === 'Premium';

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-12 flex flex-col gap-10">
        <h1 className="text-4xl font-extrabold text-indigo-700 text-right mb-2">אזור אישי</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-gray-500 text-lg mb-1">שם</label>
            <div className="p-3 bg-gray-100 rounded-lg text-right text-xl font-medium text-gray-800 shadow-sm">{user.name}</div>
          </div>
          <div>
            <label className="block text-gray-500 text-lg mb-1">אימייל</label>
            <div className="p-3 bg-gray-100 rounded-lg text-right text-xl font-medium text-gray-800 shadow-sm">{user.email}</div>
          </div>
          <div>
            <label className="block text-gray-500 text-lg mb-1">סטטוס מנוי</label>
            <div className={`flex items-center gap-3 p-3 rounded-lg text-xl font-semibold shadow-sm ${isPremium ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'}`}>
              {isPremium ? 'פרימיום' : 'חינמי'}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between w-full">
          <div className="flex-1">
            <label className="block text-gray-500 text-lg mb-2">קבלה אחרונה</label>
            {isPremium && user.receipt ? (
              <div className="bg-gray-100 rounded-lg p-4 text-right">
                <div>מספר קבלה: <span className="font-bold">{user.receipt.id}</span></div>
                <div>תאריך: <span className="font-bold">{user.receipt.date}</span></div>
                <div>סכום: <span className="font-bold">{user.receipt.amount}</span></div>
                <div className="mt-2">
                  <a href={user.receipt.url} className="text-blue-600 underline font-semibold" target="_blank" rel="noopener noreferrer">הורד קבלה</a>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-right text-gray-400">אין קבלות להצגה</div>
            )}
          </div>
          <div className="flex-shrink-0 w-full md:w-auto mt-6 md:mt-0">
            {isPremium ? (
              <button className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors shadow-md w-full md:w-auto">
                בטל מנוי
              </button>
            ) : (
              <Link to="/membership-payment" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md w-full md:w-auto block text-center">
                שדרג לפרימיום
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails; 