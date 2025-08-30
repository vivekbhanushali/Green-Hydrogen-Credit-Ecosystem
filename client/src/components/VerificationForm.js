import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Brain,
  Zap,
  Leaf,
  TrendingUp,
  Shield
} from 'lucide-react';
import { submitVerification } from '../api/api';

const VerificationForm = () => {
  const [formData, setFormData] = useState({
    energy_mwh: '',
    h2_kg: '',
    production_method: 'wind',
    production_date: new Date().toISOString().split('T')[0]
  });
  
  const [mlResult, setMlResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [autoCredit, setAutoCredit] = useState(null);

  const productionMethods = [
    { value: 'wind', label: 'Wind H₂', icon: TrendingUp }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await submitVerification(formData);
      setMlResult(response.ml_verification);
      setDocuments(response.documents);
      
      // Handle auto-generated credit
      if (response.credit_created && response.auto_credit) {
        setAutoCredit(response.auto_credit);
        alert('🎉 ML Verification PASSED! Credit automatically created and ready for trading!');
      } else if (response.ml_verification.is_valid) {
        alert('✅ Verification submitted successfully! ML model validated your H₂ production.');
      } else {
        alert('❌ Verification rejected by ML model. Please check your data.');
      }
    } catch (error) {
      console.error('Verification submission failed:', error);
      alert('❌ Verification submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateEfficiency = () => {
    if (formData.energy_mwh && formData.h2_kg) {
      const efficiency = (parseFloat(formData.energy_mwh) * 1000) / parseFloat(formData.h2_kg);
      return efficiency.toFixed(2);
    }
    return null;
  };

  const getEfficiencyStatus = (efficiency) => {
    if (!efficiency) return null;
    const eff = parseFloat(efficiency);
    if (eff >= 45 && eff <= 55) return { status: 'excellent', color: 'text-green-600' };
    if (eff > 55 && eff <= 60) return { status: 'good', color: 'text-yellow-600' };
    return { status: 'poor', color: 'text-red-600' };
  };

  const efficiency = calculateEfficiency();
  const efficiencyStatus = getEfficiencyStatus(efficiency);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">H₂ Production Verification</h1>
              <p className="text-blue-100">AI-Powered Deep Learning Verification System</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Production Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Production Method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {productionMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({...formData, production_method: method.value})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.production_method === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy and H₂ Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewable Energy Produced (MWh)
                </label>
                <input
                  type="number"
                  name="energy_mwh"
                  value={formData.energy_mwh}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  H₂ Production (kg)
                </label>
                <input
                  type="number"
                  name="h2_kg"
                  value={formData.h2_kg}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 18.5"
                  required
                />
              </div>
            </div>

            {/* Efficiency Calculator */}
            {efficiency && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Calculated Efficiency</h3>
                    <p className="text-sm text-gray-600">
                      {efficiency} kWh/kg H₂
                    </p>
                  </div>
                  <div className={`text-right ${efficiencyStatus?.color}`}>
                    <div className="text-lg font-bold">{efficiencyStatus?.status?.toUpperCase()}</div>
                    <div className="text-sm">
                      {efficiencyStatus?.status === 'excellent' && 'Industry Standard'}
                      {efficiencyStatus?.status === 'good' && 'Acceptable'}
                      {efficiencyStatus?.status === 'poor' && 'Below Standard'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Production Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date
              </label>
              <input
                type="date"
                name="production_date"
                value={formData.production_date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing with AI...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Submit for ML Verification</span>
                </div>
              )}
            </button>
          </form>

          {/* ML Results */}
          {mlResult && (
            <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">AI Verification Results</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Validity Score */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      mlResult.is_valid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mlResult.is_valid ? '✅ VALID' : '❌ INVALID'}
                    </div>
                    <div className="text-sm text-gray-600">ML Validation</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(mlResult.validity_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Efficiency Score */}
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-blue-600">
                      {(mlResult.efficiency_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Efficiency Score</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {mlResult.calculated_efficiency.toFixed(2)} kWh/kg
                    </div>
                  </div>

                  {/* Fraud Probability */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      mlResult.fraud_probability > 0.5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(mlResult.fraud_probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Fraud Risk</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {mlResult.fraud_probability > 0.5 ? 'HIGH' : 'LOW'}
                    </div>
                  </div>
                </div>

                {/* Expected Range */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Expected H₂ Production Range</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span>Minimum Expected: {mlResult.min_expected_h2.toFixed(2)} kg</span>
                    <span className="font-medium">Your Production: {mlResult.h2_production_kg.toFixed(2)} kg</span>
                    <span>Maximum Expected: {mlResult.max_expected_h2.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

                     {/* Auto-Generated Credit */}
           {autoCredit && (
             <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg overflow-hidden">
               <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white">
                 <div className="flex items-center space-x-3">
                   <CheckCircle className="w-6 h-6" />
                   <h3 className="text-lg font-semibold">🎉 Auto-Generated Credit Created!</h3>
                 </div>
                 <p className="text-green-100 text-sm mt-1">ML verification passed - Credit ready for trading</p>
               </div>
               
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Credit ID:</span>
                       <span className="text-sm font-semibold text-gray-900">{autoCredit.id}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Name:</span>
                       <span className="text-sm font-semibold text-gray-900">{autoCredit.name}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Amount:</span>
                       <span className="text-sm font-semibold text-green-600">{autoCredit.amount} kg H₂</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Price:</span>
                       <span className="text-sm font-semibold text-green-600">${autoCredit.price}</span>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Production Method:</span>
                       <span className="text-sm font-semibold text-gray-900">{autoCredit.production_method}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Energy Input:</span>
                       <span className="text-sm font-semibold text-gray-900">{autoCredit.energy_input} MWh</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">Efficiency:</span>
                       <span className="text-sm font-semibold text-green-600">{autoCredit.efficiency} kWh/kg</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-600">ML Score:</span>
                       <span className="text-sm font-semibold text-green-600">{(autoCredit.ml_verification_score * 100).toFixed(1)}%</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
                   <div className="flex items-center space-x-2">
                     <CheckCircle className="w-5 h-5 text-green-600" />
                     <span className="text-sm font-medium text-green-800">
                       This credit is automatically generated and verified by AI. It's ready for immediate trading on the marketplace!
                     </span>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Generated Documents */}
           {documents.length > 0 && (
             <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900">Generated Government Documents</h3>
               </div>
               
               <div className="p-6">
                 <div className="space-y-4">
                   {documents.map((doc, index) => (
                     <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                       <FileText className="w-8 h-8 text-blue-600 mr-4" />
                       <div className="flex-1">
                         <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                         <p className="text-sm text-gray-600">{doc.content}</p>
                         {doc.certificate_number && (
                           <p className="text-xs text-gray-500 mt-1">
                             Certificate: {doc.certificate_number}
                           </p>
                         )}
                       </div>
                       <CheckCircle className="w-6 h-6 text-green-600" />
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VerificationForm;


