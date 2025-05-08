import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const UsageStatus = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsageStatus();
  }, []);

  const fetchUsageStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/usage-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.usageData) {
        setUsageData(data.usageData);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching usage status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2.5"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-600 text-sm">שגיאה בטעינת נתוני שימוש: {error}</p>
      </div>
    );
  }

  if (!usageData) return null;

  const { currentMonthUsage, limit, isLimitReached, subscriptionStatus, nextResetDate } = usageData;
  const usagePercentage = limit ? Math.min(100, Math.round((currentMonthUsage / limit) * 100)) : 0;
  const isPremium = subscriptionStatus === 'premium' || subscriptionStatus === 'pro';
  const formattedResetDate = nextResetDate ? new Date(nextResetDate).toLocaleDateString('he-IL') : '';

  // Determine color based on usage percentage
  let statusColor = 'bg-green-500';
  if (usagePercentage > 90) {
    statusColor = 'bg-red-500';
  } else if (usagePercentage > 70) {
    statusColor = 'bg-yellow-500';
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
        <div className="flex items-center mb-2 md:mb-0">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColor}`}></span>
          <span className="text-lg font-bold text-gray-800">
            {isPremium ? '🌟 חשבון פרימיום' : '⭐ חשבון רגיל'}
          </span>
        </div>
        
        {!isPremium && (
          <a 
            href="/membership-payment"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors"
          >
            שדרג עכשיו
          </a>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">שימוש חודשי</span>
          <span className="text-gray-600">{currentMonthUsage} / {limit || 'ללא הגבלה'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full ${statusColor}`} 
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </div>
      
      {nextResetDate && (
        <div className="text-xs text-gray-500 mt-2">
          איפוס שימוש הבא: {formattedResetDate}
        </div>
      )}
      
      {isLimitReached && !isPremium && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
          הגעת למגבלת השימוש החודשית. שדרג לפרימיום להסרת ההגבלה.
        </div>
      )}
    </div>
  );
};

export default UsageStatus; 