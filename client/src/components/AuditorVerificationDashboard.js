import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  User,
  Zap,
  Leaf
} from 'lucide-react';
import { getPendingVerifications, approveVerification, rejectVerification } from '../api/api';

const AuditorVerificationDashboard = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await getPendingVerifications();
      setVerifications(response);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId) => {
    try {
      await approveVerification(verificationId, { notes });
      alert('✅ Verification approved! Credits generated successfully.');
      fetchPendingVerifications();
      setSelectedVerification(null);
      setNotes('');
    } catch (error) {
      console.error('Approval failed:', error);
      alert('❌ Approval failed. Please try again.');
    }
  };

  const handleReject = async (verificationId) => {
    try {
      await rejectVerification(verificationId, { notes });
      alert('❌ Verification rejected.');
      fetchPendingVerifications();
      setSelectedVerification(null);
      setNotes('');
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('❌ Rejection failed. Please try again.');
    }
  };

  const getProductionMethodIcon = (method) => {
    switch (method) {
      case 'electrolysis': return Zap;
      case 'solar': return Leaf;
      case 'wind': return TrendingUp;
      default: return Shield;
    }
  };

  const getMlStatusColor = (mlResult) => {
    if (mlResult.is_valid && mlResult.fraud_probability < 0.3) return 'text-green-600';
    if (mlResult.is_valid && mlResult.fraud_probability < 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">AI-Powered Verification Dashboard</h1>
              <p className="text-purple-100">Review ML-verified H₂ production requests</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {verifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Verifications</h3>
              <p className="text-gray-600">All H₂ production requests have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Verification List */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Verifications</h2>
                <div className="space-y-4">
                  {verifications.map((verification) => {
                    const MethodIcon = getProductionMethodIcon(verification.production_method);
                    return (
                      <div
                        key={verification.id}
                        onClick={() => setSelectedVerification(verification)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedVerification?.id === verification.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <MethodIcon className="w-6 h-6 text-blue-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {verification.industry_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {verification.production_method} • {verification.hydrogen_amount} kg H₂
                              </p>
                            </div>
                          </div>
                          <div className={`text-right ${getMlStatusColor(verification.ml_verification)}`}>
                            <div className="text-lg font-bold">
                              {(verification.ml_verification.validity_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs">ML Score</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Efficiency:</span>
                            <div className="font-medium">
                              {verification.ml_verification.calculated_efficiency.toFixed(2)} kWh/kg
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Fraud Risk:</span>
                            <div className={`font-medium ${
                              verification.ml_verification.fraud_probability > 0.5 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {(verification.ml_verification.fraud_probability * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Documents:</span>
                            <div className="font-medium">{verification.documents_count}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verification Details */}
              {selectedVerification && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h2>
                  
                  <div className="space-y-6">
                    {/* Industry Info */}
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <h3 className="font-medium text-gray-900">Industry Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Industry:</span>
                          <div className="font-medium">{selectedVerification.industry_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Production Date:</span>
                          <div className="font-medium">{selectedVerification.production_date}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Method:</span>
                          <div className="font-medium capitalize">{selectedVerification.production_method}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">H₂ Amount:</span>
                          <div className="font-medium">{selectedVerification.hydrogen_amount} kg</div>
                        </div>
                      </div>
                    </div>

                    {/* ML Verification Results */}
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">AI Verification Results</h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${
                            selectedVerification.ml_verification.is_valid ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedVerification.ml_verification.is_valid ? '✅' : '❌'}
                          </div>
                          <div className="text-xs text-gray-600">Valid</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1 text-blue-600">
                            {(selectedVerification.ml_verification.validity_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${
                            selectedVerification.ml_verification.fraud_probability > 0.5 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {(selectedVerification.ml_verification.fraud_probability * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-600">Fraud Risk</div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Expected Range Analysis</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span>Min: {selectedVerification.ml_verification.min_expected_h2.toFixed(2)} kg</span>
                          <span className="font-medium">Actual: {selectedVerification.ml_verification.h2_production_kg.toFixed(2)} kg</span>
                          <span>Max: {selectedVerification.ml_verification.max_expected_h2.toFixed(2)} kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Auditor Notes */}
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Auditor Notes</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your verification notes..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApprove(selectedVerification.id)}
                        disabled={!selectedVerification.ml_verification.is_valid}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Approve & Generate Credits</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleReject(selectedVerification.id)}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>Reject</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorVerificationDashboard;


