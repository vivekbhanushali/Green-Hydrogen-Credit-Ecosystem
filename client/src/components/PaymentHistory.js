import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, DollarSign } from 'lucide-react';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Load payment history from localStorage
    const loadPayments = () => {
      const paymentKeys = Object.keys(localStorage).filter(key => key.startsWith('payment_'));
      const paymentData = paymentKeys
        .map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch {
            return null;
          }
        })
        .filter(payment => payment !== null)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setPayments(paymentData);
    };

    loadPayments();
    
    // Listen for storage changes (in case payments are added from other tabs)
    const handleStorageChange = () => loadPayments();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'bank':
      case 'crypto':
        return <Wallet className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No payment history yet</p>
        <p className="text-sm">Your payment records will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
      {payments.map((payment, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              {getMethodIcon(payment.method)}
            </div>
            <div>
              <div className="font-medium text-gray-800">
                ${payment.amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {payment.method} • {payment.currency}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {formatDate(payment.timestamp)}
            </div>
            <div className="text-xs text-gray-500">
              {formatWalletAddress(payment.walletAddress)}
            </div>
          </div>
          
          <div className="ml-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {payment.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;
