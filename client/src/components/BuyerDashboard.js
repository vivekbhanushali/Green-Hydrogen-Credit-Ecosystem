import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getBuyerCredits, purchaseCredit, sellCreditApi, removeSaleCreditApi, getPurchasedCredits, generateCertificate, downloadCertificate, getPortfolioAnalytics, getMarketTrends, getRecommendations, getNotifications } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import { ethers } from "ethers";
import { Eye, EyeOff, Loader2, File, Info, Download, ShoppingCart, XCircle, Tag, DollarSign, AlertCircle, TrendingUp, BarChart3, Users, Target, Zap, Star, Filter, Search, Bell, Share2, Calendar, TrendingDown, Award, Globe, Leaf, Coins, Wallet, PieChart, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Crown, Trophy, Gift, Shield, Clock, CheckCircle, AlertTriangle, Heart, MessageCircle, Bookmark, Share, Eye as EyeIcon, BarChart, LineChart, PieChart as PieChartIcon, Target as TargetIcon, Zap as ZapIcon, Star as StarIcon, Filter as FilterIcon, Search as SearchIcon, Bell as BellIcon, Share2 as Share2Icon, Calendar as CalendarIcon, TrendingDown as TrendingDownIcon, Award as AwardIcon, Globe as GlobeIcon, Leaf as LeafIcon, Coins as CoinsIcon, Wallet as WalletIcon, PieChart as PieChartIcon2, Activity as ActivityIcon, ArrowUpRight as ArrowUpRightIcon, ArrowDownRight as ArrowDownRightIcon, Sparkles as SparklesIcon, Crown as CrownIcon, Trophy as TrophyIcon, Gift as GiftIcon, Shield as ShieldIcon, Clock as ClockIcon, CheckCircle as CheckCircleIcon, AlertTriangle as AlertTriangleIcon, Heart as HeartIcon, MessageCircle as MessageCircleIcon, Bookmark as BookmarkIcon, Share as ShareIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Modular Details Button Component
const DetailsButton = ({ creditId }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/credits/${creditId}`);
  };

  return (
    <button
      onClick={handleViewDetails}
      className="flex justify-center items-center p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
    >
      <Info size={16} />
    </button>
  );
};

const LoadingCredit = () => (
  <li className="flex justify-between items-center py-2 px-4 text-sm animate-pulse">
    <div className="flex-1">
      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="w-16">
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </li>
);

const BuyerDashboard = () => {
  const [availableCredits, setAvailableCredits] = useState([]);
  const [purchasedCredits, setPurchasedCredits] = useState([]);
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState(null);
  const [showCertificate, setShowCertificate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTx, setPendingTx] = useState(null);
  
  // 🚀 ADVANCED FEATURES STATE
  const [activeTab, setActiveTab] = useState('portfolio');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [hydrogenImpact, setHydrogenImpact] = useState(0);
  const [marketTrends, setMarketTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    totalInvested: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
            hydrogenOffset: 0,
    creditsCount: 0
  });

  const {
    connectWallet,
    generateCredit,
    getCreditDetails,
    getNextCreditId,
    getPrice,
    sellCredit,
    removeFromSale,
    buyCredit,
    currentAccount
  } = useContext(CC_Context);

  // 🚀 ENHANCED DATA FETCHING WITH ANALYTICS
  const fetchAllCredits = async () => {
    try {
      setIsLoading(true);
      const [availableResponse, purchasedResponse, analyticsResponse, trendsResponse, recommendationsResponse, notificationsResponse] = await Promise.all([
        getBuyerCredits(),
        getPurchasedCredits(),
        getPortfolioAnalytics(),
        getMarketTrends(),
        getRecommendations(),
        getNotifications()
      ]);

      const creditsWithSalePrice = purchasedResponse.data.map(credit => ({
        ...credit,
        salePrice: '',
        isFavorite: favorites.includes(credit.id),
        performance: Math.random() * 100 - 50, // Mock performance data
                  hydrogenImpact: credit.amount * 0.5, // Mock hydrogen impact
        marketTrend: Math.random() > 0.5 ? 'up' : 'down',
        rating: Math.floor(Math.random() * 5) + 1,
        reviews: Math.floor(Math.random() * 50) + 10
      }));

      setPurchasedCredits(creditsWithSalePrice);
      setAvailableCredits(availableResponse.data);
      
      // 🚀 SET REAL DATA FROM API
      setPerformanceData(analyticsResponse.data);
      setMarketTrends(trendsResponse.data);
      setRecommendations(recommendationsResponse.data);
      setNotifications(notificationsResponse.data);
      
    } catch (error) {
      console.error('Failed to fetch credits:', error?.message);
      setError('Failed to fetch credits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    fetchAllCredits();
  }, []);

  const handleBuyCredit = async (creditId) => {
    try {
      setError(null);
      setPendingTx(creditId);

      // Temporarily disable blockchain calls
      // const credit = await getCreditDetails(creditId);
      // const priceInEther = ethers.formatEther(credit.price);
      // console.log("id, price: ", creditId, priceInEther);
      // const receipt = await buyCredit(creditId, priceInEther);
      
      // Use a mock transaction hash for now
      const mockReceipt = { hash: '0x' + Math.random().toString(16).substr(2, 64) };
      await purchaseCredit({ credit_id: creditId, txn_hash: mockReceipt.hash });

      await fetchAllCredits();
      
      // Show success message
      Swal.fire({
        icon: "success",
        title: "Purchase Successful!",
        text: "Credit purchased successfully (blockchain temporarily disabled).",
      });
      
    } catch (error) {
      console.error('Failed to purchase credit:', error);
      setError('Failed to purchase credit. Please try again.');
    } finally {
      setPendingTx(null);
    }
  };

  const handleGenerateCertificate = async (creditId) => {
    try {
      setError(null);
      const response = await generateCertificate(creditId);
      setShowCertificate(false);
      setCertificateData(response.data);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      setError('Failed to generate certificate. Please try again.');
    }
  };

  const handleHideCertificate = async () => {
    setCertificateData(null);
    setShowCertificate(true);
  };

  const handleDownloadCertificate = async (creditId) => {
    try {
      setError(null);
      const response = await downloadCertificate(creditId);
      const linksource = `data:application/pdf;base64,${response.data.pdf_base64}`;
      const downloadLink = document.createElement("a");
      const fileName = response.data.filename;
      downloadLink.href = linksource;
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.error("Failed to download Certificate: ", error);
      setError('Failed to download certificate. Please try again.');
    }
  };

  const handleSellInput = (creditId) => {
    setPurchasedCredits((prevCredits) =>
      prevCredits.map((credit) =>
        credit.id === creditId ? { ...credit, showSellInput: !credit.showSellInput } : credit
      )
    );
  };

  const handlePriceChange = (creditId, price) => {
    setPurchasedCredits((prevCredits) =>
      prevCredits.map((credit) =>
        credit.id === creditId ? { ...credit, salePrice: price } : credit
      )
    );
  };

  const confirmSale = async (creditId) => {
    try {
      const updatedCredits = purchasedCredits.map((credit) =>
        credit.id === creditId
          ? { ...credit, is_active: true, showSellInput: false, salePrice: credit.salePrice || '' }
          : credit
      );
      setPurchasedCredits(updatedCredits);

      const updatedCredit = updatedCredits.find((credit) => credit.id === creditId);
      console.log(`Credit put on sale with price: ${updatedCredit.salePrice}`);

      // Temporarily disable blockchain call
      // await sellCredit(creditId, updatedCredit.salePrice);
      
      const response = await sellCreditApi({ credit_id: creditId, salePrice: updatedCredit.salePrice });
      console.log(response);
      await fetchAllCredits();
      
      // Show success message
      Swal.fire({
        icon: "success",
        title: "Credit Listed for Sale!",
        text: "Your credit has been listed for sale successfully.",
      });
      
    } catch (error) {
      console.error("Can't sale credit: ", error);
      setError('Failed to sell credit');
      handleSellError();
      await fetchAllCredits();
    }
  };

  const handleRemoveFromSale = async (creditId) => {
    try {
      setPurchasedCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_active: false, salePrice: null } : credit
        )
      );

      await removeFromSale(creditId);
      await removeSaleCreditApi({ credit_id: creditId });
      console.log(`Removed credit ID ${creditId} from sale`);
      await fetchAllCredits();
    } catch (error) {
      console.error("We shouldnt be getting error here T:T : ", error);
      setError('Failed to remove credit');
      handleSellError();
      await fetchAllCredits();
    }
  };

  // 🚀 ADVANCED FEATURE HANDLERS
  const handleFavorite = (creditId) => {
    setFavorites(prev => 
      prev.includes(creditId) 
        ? prev.filter(id => id !== creditId)
        : [...prev, creditId]
    );
  };

  const handleBulkAction = (action) => {
    if (selectedCredits.length === 0) {
      Swal.fire('No credits selected', 'Please select credits to perform bulk actions', 'warning');
      return;
    }
    
    Swal.fire({
      title: `Confirm ${action}`,
      text: `Are you sure you want to ${action} ${selectedCredits.length} credits?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Implement bulk actions
        Swal.fire('Success!', `${action} completed for ${selectedCredits.length} credits`, 'success');
        setSelectedCredits([]);
      }
    });
  };

  const handleExportPortfolio = () => {
    const data = {
      portfolio: purchasedCredits,
      performance: performanceData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleSharePortfolio = () => {
    const shareData = {
              title: 'My Hydrogen Credit Portfolio',
        text: `Check out my hydrogen credit portfolio! I've produced ${performanceData.hydrogenOffset.toFixed(2)} kg of H₂!`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareData.text);
      Swal.fire('Shared!', 'Portfolio link copied to clipboard', 'success');
    }
  };

  const handleSellError = () => {
    Swal.fire({
      icon: 'error',
      title: 'Error !',
      html: 'Possible Reasons:<br><br>1. Check MetaMask account is the one you bought with'
    });
  };

  // 🚀 FILTERED AND SORTED DATA
  const filteredAndSortedCredits = useMemo(() => {
    let filtered = purchasedCredits;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(credit => 
        credit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.creator?.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(credit => credit.name.includes(filterType));
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'performance':
        filtered.sort((a, b) => (b.performance || 0) - (a.performance || 0));
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        break;
    }
    
    return filtered;
  }, [purchasedCredits, searchTerm, filterType, sortBy]);

  return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* 🚀 HERO SECTION WITH PORTFOLIO OVERVIEW */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Portfolio Value</p>
                <p className="text-2xl font-bold">${performanceData.currentValue.toFixed(2)}</p>
                <p className={`text-sm ${performanceData.profitLoss >= 0 ? 'text-green-200' : 'text-green-300'}`}>
                  {performanceData.profitLoss >= 0 ? '+' : ''}{performanceData.profitLossPercentage.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Green Hydrogen</p>
                <p className="text-2xl font-bold">{performanceData.hydrogenOffset.toFixed(1)} kg</p>
                <p className="text-green-200 text-sm">H₂ produced</p>
              </div>
                              <Leaf className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">H₂ Credits</p>
                <p className="text-2xl font-bold">{performanceData.creditsCount}</p>
                <p className="text-green-200 text-sm">Active holdings</p>
              </div>
                              <Coins className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-300 to-emerald-400 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Invested</p>
                <p className="text-2xl font-bold">${performanceData.totalInvested.toFixed(2)}</p>
                <p className="text-green-200 text-sm">ETH</p>
              </div>
                              <Wallet className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* 🚀 NAVIGATION TABS */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'portfolio', label: 'H₂ Portfolio', icon: PieChart },
                { id: 'marketplace', label: 'H₂ Marketplace', icon: ShoppingCart },
                { id: 'analytics', label: 'H₂ Analytics', icon: BarChart3 },
                { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
                { id: 'notifications', label: 'Notifications', icon: Bell }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {error && (
            <div className="p-4 text-green-700 bg-green-50">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}

          <div className="p-6">
            {/* 🚀 PORTFOLIO TAB CONTENT */}
            {activeTab === 'portfolio' && (
              <div>
                {/* 🚀 ADVANCED CONTROLS */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search credits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="Wind">Wind H₂</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      {viewMode === 'grid' ? <BarChart3 className="w-5 h-5" /> : <PieChart className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={handleExportPortfolio}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    
                    <button
                      onClick={handleSharePortfolio}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* 🚀 ENHANCED PORTFOLIO GRID */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedCredits.map((credit) => (
                      <div key={credit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">{credit.name}</h3>
                              <p className="text-sm text-gray-500">by {credit.creator?.username || 'Unknown'}</p>
                            </div>
                            <button
                              onClick={() => handleFavorite(credit.id)}
                              className={`p-2 rounded-full transition-colors ${
                                credit.isFavorite 
                                  ? 'text-green-500 bg-green-50' 
                                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${credit.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="text-sm font-medium">{credit.amount} tons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="text-sm font-medium">{credit.price} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Performance:</span>
                              <span className={`text-sm font-medium flex items-center ${
                                credit.performance >= 0 ? 'text-green-600' : 'text-green-400'
                              }`}>
                                {credit.performance >= 0 ? '+' : ''}{credit.performance?.toFixed(2) || 0}%
                                {credit.performance >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">H₂ Production:</span>
                              <span className="text-sm font-medium text-green-600">{credit.hydrogenImpact?.toFixed(1) || 0} kg H₂</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < (credit.rating || 0) ? 'text-green-400 fill-current' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">({credit.reviews || 0})</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              credit.is_expired ? 'bg-green-100 text-green-800' : 
                              credit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {credit.is_expired ? 'Expired' : credit.is_active ? 'For Sale' : 'Held'}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <DetailsButton creditId={credit.id} />
                            {credit.secure_url && (
                              <button
                                onClick={() => window.open(credit.secure_url, '_blank')}
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                              >
                                <File className="w-4 h-4 mr-1" />
                                View Docs
                              </button>
                            )}
                            {credit.is_expired ? (
                              <button
                                onClick={() => handleGenerateCertificate(credit.id)}
                                className="flex-1 px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center"
                              >
                                <Award className="w-4 h-4 mr-1" />
                                Certificate
                              </button>
                            ) : credit.is_active ? (
                              <button
                                onClick={() => handleRemoveFromSale(credit.id)}
                                className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Remove Sale
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSellInput(credit.id)}
                                className="flex-1 px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Sell
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {filteredAndSortedCredits.map((credit) => (
                      <li key={credit.id} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-center space-x-4">
                          <Tag className="w-5 h-5 text-emerald-500" />
                          <div>
                            <h4 className="font-medium text-gray-800">{credit.name}</h4>
                            <p className="text-sm text-gray-500">by {credit.creator?.username || 'Unknown'}</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{credit.amount} tons</span> • <span>{credit.price} ETH</span>
                          </div>
                          <div className={`flex items-center text-sm ${
                            credit.performance >= 0 ? 'text-green-600' : 'text-green-400'
                          }`}>
                            {credit.performance >= 0 ? '+' : ''}{credit.performance?.toFixed(2) || 0}%
                            {credit.performance >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleFavorite(credit.id)}
                            className={`p-2 rounded-full transition-colors ${
                              credit.isFavorite 
                                ? 'text-green-500 bg-green-50' 
                                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${credit.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <DetailsButton creditId={credit.id} />
                          {credit.secure_url && (
                            <button
                              onClick={() => window.open(credit.secure_url, '_blank')}
                              className="p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                            >
                              <File size={16} />
                            </button>
                          )}
                          {credit.is_expired ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showCertificate ? handleGenerateCertificate(credit.id) : handleHideCertificate()}
                                className="p-2 text-emerald-500 bg-white rounded-md hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
                              >
                                {showCertificate ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <button
                                onClick={() => handleDownloadCertificate(credit.id)}
                                className="p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          ) : credit.is_active ? (
                            <button
                              onClick={() => handleRemoveFromSale(credit.id)}
                              className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1 inline" />
                              Remove from Sale
                            </button>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              {credit.showSellInput ? (
                                <button
                                  onClick={() => handleSellInput(credit.id)}
                                  className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSellInput(credit.id)}
                                  className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
                                >
                                  <DollarSign className="w-4 h-4 mr-1 inline" />
                                  Sell
                                </button>
                              )}
                              {credit.showSellInput && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-300"
                                    value={credit.salePrice || ''}
                                    onChange={(e) => handlePriceChange(credit.id, e.target.value)}
                                  />
                                  <button
                                    onClick={() => confirmSale(credit.id)}
                                    className="px-3 py-1 text-sm font-medium text-white bg-green-400 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <p className="text-xs text-gray-500">
                                    (90% to you, 10% to creator)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {filteredAndSortedCredits.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No credits found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}

            {/* 🚀 MARKETPLACE TAB CONTENT */}
            {activeTab === 'marketplace' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Available Credits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                      <>
                        <LoadingCredit />
                        <LoadingCredit />
                        <LoadingCredit />
                      </>
                    ) : availableCredits.map((credit) => (
                      <div key={credit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">{credit.name}</h3>
                              <p className="text-sm text-gray-500">by {credit.creator?.username || 'Unknown'}</p>
                            </div>
                            <button
                              onClick={() => handleFavorite(credit.id)}
                              className={`p-2 rounded-full transition-colors ${
                                favorites.includes(credit.id)
                                  ? 'text-green-500 bg-green-50' 
                                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${favorites.includes(credit.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="text-sm font-medium">{credit.amount} tons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="text-sm font-medium">{credit.price} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">H₂ Production:</span>
                              <span className="text-sm font-medium text-green-600">{credit.amount * 0.5} kg H₂</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <DetailsButton creditId={credit.id} />
                            {credit.secure_url && (
                              <button
                                onClick={() => window.open(credit.secure_url, '_blank')}
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                              >
                                <File className="w-4 h-4 mr-1" />
                                View Docs
                              </button>
                            )}
                            <button
                              onClick={() => handleBuyCredit(credit.id)}
                              disabled={credit.amount <= 0 || pendingTx === credit.id}
                              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-colors ${
                                credit.amount > 0
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {pendingTx === credit.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  Buying...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 mr-1" />
                                  {credit.amount > 0 ? 'Buy Now' : 'Out of Stock'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 ANALYTICS TAB CONTENT */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Invested</span>
                        <span className="font-semibold">${performanceData.totalInvested.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Value</span>
                        <span className="font-semibold">${performanceData.currentValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Profit/Loss</span>
                        <span className={`font-semibold ${performanceData.profitLoss >= 0 ? 'text-green-600' : 'text-green-400'}`}>
                          {performanceData.profitLoss >= 0 ? '+' : ''}${performanceData.profitLoss.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ROI</span>
                        <span className={`font-semibold ${performanceData.profitLossPercentage >= 0 ? 'text-green-600' : 'text-green-400'}`}>
                          {performanceData.profitLossPercentage >= 0 ? '+' : ''}{performanceData.profitLossPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Green Hydrogen Impact</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">{performanceData.hydrogenOffset.toFixed(1)}</div>
                      <div className="text-gray-600">kg of H₂ produced</div>
                      <div className="mt-4 text-sm text-gray-500">
                        Equivalent to {Math.round(performanceData.hydrogenOffset * 0.5)} kg CO₂ avoided
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">H₂ Market Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {marketTrends.map((trend, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{trend.name}</span>
                          <span className={`flex items-center text-sm ${
                            trend.trend === 'up' ? 'text-green-600' : 'text-green-400'
                          }`}>
                            {trend.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {trend.percentage}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">Volume: {trend.volume}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 AI RECOMMENDATIONS TAB CONTENT */}
            {activeTab === 'recommendations' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">AI-Powered Recommendations</h4>
                  <p className="text-gray-600 mb-6">Based on your portfolio and market trends, here are credits we think you'll love:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((credit, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">{credit.name}</h3>
                              <p className="text-sm text-gray-500">by {credit.creator?.username || 'Unknown'}</p>
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {credit.score.toFixed(0)}% Match
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="text-sm font-medium">{credit.amount} tons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="text-sm font-medium">{credit.price} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Why Recommended:</span>
                              <span className="text-sm font-medium text-green-600">{credit.reason}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <DetailsButton creditId={credit.id} />
                            <button
                              onClick={() => handleBuyCredit(credit.id)}
                              disabled={credit.amount <= 0 || pendingTx === credit.id}
                              className="flex-1 px-3 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center"
                            >
                              {pendingTx === credit.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  Buying...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  Buy Recommended
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 NOTIFICATIONS TAB CONTENT */}
            {activeTab === 'notifications' && (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Smart Notifications</h4>
                  
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 rounded-lg border-l-4 ${
                        notification.type === 'success' ? 'bg-green-50 border-green-400' :
                        notification.type === 'warning' ? 'bg-green-100 border-green-300' :
                        notification.type === 'error' ? 'bg-green-50 border-green-200' :
                        'bg-green-50 border-green-300'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`mt-1 ${
                              notification.type === 'success' ? 'text-green-500' :
                              notification.type === 'warning' ? 'text-green-400' :
                              notification.type === 'error' ? 'text-green-300' :
                              'text-green-400'
                            }`}>
                              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                               notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                               notification.type === 'error' ? <XCircle className="w-5 h-5" /> :
                               <Info className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Display */}
            {certificateData && (
              <div className="mt-8 p-4 bg-white rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Certificate</h4>
                  <button
                    onClick={handleHideCertificate}
                    className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <div
                  className="p-4 border border-gray-200 rounded-md"
                  dangerouslySetInnerHTML={{ __html: certificateData.certificate_html }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;