import React, { useContext, useEffect, useState } from 'react';
import { getProfile, getPurchasedCredits, getNGOCredits } from '../api/api';
import { CC_Context } from '../context/SmartContractConnector';
import { User, Wallet, Tag, Plus } from 'lucide-react';
import PaymentGateway from './PaymentGateway';
import PaymentHistory from './PaymentHistory';

const Profile = () => {
  const { currentAccount, connectWallet, getWalletBalance, error } = useContext(CC_Context);
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProfile();
        if (res && res.data) {
          setProfile(res.data);
          if (res.data.role === 'buyer') {
            try {
              const purchased = await getPurchasedCredits();
              setCredits(purchased?.data || []);
            } catch (creditError) {
              console.error('Error loading purchased credits:', creditError);
              setCredits([]);
            }
          } else if (res.data.role === 'NGO') {
            try {
              const mine = await getNGOCredits();
              setCredits(mine?.data || []);
            } catch (creditError) {
              console.error('Error loading NGO credits:', creditError);
              setCredits([]);
            }
          } else {
            setCredits([]);
          }
        } else {
          console.error('Invalid profile response:', res);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadBal = async () => {
      if (currentAccount) {
        const b = await getWalletBalance(currentAccount);
        setBalance(b);
      }
    };
    loadBal();
  }, [currentAccount, getWalletBalance]);

  const handlePaymentSuccess = () => {
    // Refresh wallet balance after successful payment
    if (currentAccount) {
      getWalletBalance(currentAccount).then(setBalance);
    }
  };

  const handleConnectWallet = async () => {
    console.log("handleConnectWallet called");
    setWalletConnecting(true);
    try {
      console.log("Calling connectWallet function...");
      await connectWallet();
      console.log("connectWallet completed successfully");
    } catch (error) {
      console.error("Error in handleConnectWallet:", error);
    } finally {
      setWalletConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Loading profile...</div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Failed to load profile</div>
          <div className="text-sm text-gray-500">Please try refreshing the page or logging in again.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <User className="w-5 h-5 text-emerald-500 mr-2" />
              User Profile
            </h3>
            <p className="mt-1 text-sm text-gray-500">Account details and hydrogen credits</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Account</h4>
              <div className="text-sm text-gray-700"><span className="font-medium">Username:</span> {profile.username || 'N/A'}</div>
              <div className="text-sm text-gray-700"><span className="font-medium">Email:</span> {profile.email || 'N/A'}</div>
              <div className="text-sm text-gray-700"><span className="font-medium">Role:</span> {profile.role || 'N/A'}</div>
            </div>

            <div className="bg-green-50 rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Wallet className="w-4 h-4 mr-1 text-emerald-500" /> Wallet
                </h4>
                {currentAccount && (
                  <button
                    onClick={() => setShowPaymentGateway(true)}
                    className="flex items-center px-2 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Funds
                  </button>
                )}
              </div>
              {currentAccount ? (
                <>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Address:</span> {currentAccount}
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">ETH:</span> {balance ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Wallet connected successfully
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">No wallet connected</div>
                  <button 
                    onClick={handleConnectWallet}
                    disabled={walletConnecting}
                    className="px-3 py-1.5 text-white bg-emerald-500 rounded hover:bg-emerald-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {walletConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  <div className="text-xs text-gray-500">
                    Connect your MetaMask wallet to view balance and add funds
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{profile.role === 'buyer' ? 'Purchased Credits' : profile.role === 'NGO' ? 'My Created Credits' : 'Credits'}</h4>
            {loading ? (
              <div className="text-sm text-gray-500">Loading credits...</div>
            ) : credits.length === 0 ? (
              <div className="text-sm text-gray-500">No credits yet.</div>
            ) : (
              <ul className="space-y-2">
                {credits.map((c) => (
                  <li key={c.id} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700">{c.name}</span>
                      {typeof c.amount !== 'undefined' && (
                        <span className="text-sm text-gray-500">Amount: {c.amount}</span>
                      )}
                      {typeof c.price !== 'undefined' && (
                        <span className="text-sm text-gray-500">Price: {c.price} ETH</span>
                      )}
                    </div>
                    {c.secure_url && (
                      <a href={c.secure_url} target="_blank" rel="noreferrer" className="text-emerald-600 text-sm hover:underline">Doc</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment History Section */}
          <div className="p-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
            <PaymentHistory />
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <PaymentGateway
          onClose={() => setShowPaymentGateway(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Profile;
