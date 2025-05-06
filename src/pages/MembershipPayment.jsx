import React from 'react';

const MembershipPayment = () => {
  const handlePayment = () => {
    // TODO: Integrate Summit payment flow here
    console.log('Payment button clicked. Summit integration pending.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Upgrade to Premium</h1>
        <p className="text-gray-600 text-center mb-6">
          Get unlimited access to all features and summaries.
        </p>
        <div className="text-center mb-8">
          <span className="text-4xl font-bold">₪99</span>
          <span className="text-gray-500">/month</span>
        </div>
        <button
          onClick={handlePayment}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default MembershipPayment; 