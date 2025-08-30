import React, { useState, useContext, useMemo } from 'react';
import { CC_Context } from "../../context/SmartContractConnector.js";
import { Loader2, File, AlertTriangle, CheckCircle, AlertCircle, Tag, ChevronDown, ChevronRight, Search, Filter, Download, BarChart3, Calendar, DollarSign, TrendingUp, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Swal from 'sweetalert2';
import { expireCreditApi, verifyBeforeExpire, sellCreditApi, getNGOCredits } from '../../api/api';

const MyCreditsList = ({ credits, setCredits, isLoading }) => {
  const { expireCredit, sellCredit } = useContext(CC_Context);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const [expirationData, setExpirationData] = useState({ creditName: "", amountReduced: "", password: "" });
  const [selectedFile, setSelectedFile] = useState(null);

  // Professional features state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    accepted: true,
    rejected: true,
    forSale: true,
    expired: true
  });

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Professional features functions
  const filteredAndSortedCredits = useMemo(() => {
    let filtered = credits || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(credit => 
        credit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pending':
          filtered = filtered.filter(credit => credit.req_status === 1);
          break;
        case 'accepted':
          filtered = filtered.filter(credit => credit.req_status === 2 && credit.score > 0);
          break;
        case 'rejected':
          filtered = filtered.filter(credit => credit.req_status === 2 && credit.score <= 0);
          break;
        case 'forSale':
          filtered = filtered.filter(credit => credit.req_status === 3);
          break;
        case 'expired':
          filtered = filtered.filter(credit => credit.is_expired);
          break;
        default:
          break;
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      filtered = filtered.filter(credit => {
        const creditDate = new Date(credit.created_at);
        switch (dateFilter) {
          case 'today':
            return creditDate >= oneDayAgo;
          case 'week':
            return creditDate >= sevenDaysAgo;
          case 'month':
            return creditDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [credits, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!credits || credits.length === 0) {
      return {
        total: 0,
        totalValue: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        forSale: 0,
        expired: 0,
        averagePrice: 0,
        totalAmount: 0
      };
    }

    const total = credits.length;
    const totalValue = credits.reduce((sum, credit) => sum + (credit.price * credit.amount), 0);
    const pending = credits.filter(credit => credit.req_status === 1).length;
    const accepted = credits.filter(credit => credit.req_status === 2 && credit.score > 0).length;
    const rejected = credits.filter(credit => credit.req_status === 2 && credit.score <= 0).length;
    const forSale = credits.filter(credit => credit.req_status === 3).length;
    const expired = credits.filter(credit => credit.is_expired).length;
    const averagePrice = totalValue / total;
    const totalAmount = credits.reduce((sum, credit) => sum + credit.amount, 0);

    return {
      total,
      totalValue,
      pending,
      accepted,
      rejected,
      forSale,
      expired,
      averagePrice,
      totalAmount
    };
  }, [credits]);

  // Export functionality
  const exportCredits = (format = 'csv') => {
    const data = filteredAndSortedCredits.map(credit => ({
      ID: credit.id,
      Name: credit.name,
      Description: credit.description,
      Amount: credit.amount,
      Price: credit.price,
      Status: credit.req_status === 1 ? 'Pending' : 
              credit.req_status === 2 ? (credit.score > 0 ? 'Accepted' : 'Rejected') :
              credit.req_status === 3 ? 'For Sale' : 'Unknown',
      Score: credit.score,
      Created: credit.created_at,
      Expired: credit.is_expired ? 'Yes' : 'No'
    }));

    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no credits to export with current filters.'
      });
      return;
    }

    if (format === 'csv') {
      const csvContent = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credits_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Categorize credits (now using filtered data)
  const categorizedCredits = useMemo(() => {
    if (!filteredAndSortedCredits || filteredAndSortedCredits.length === 0) return {};

    return {
      pending: filteredAndSortedCredits.filter(credit => credit.req_status === 1),
      accepted: filteredAndSortedCredits.filter(credit => credit.req_status === 2 && credit.score > 0 && !credit.is_expired),
      rejected: filteredAndSortedCredits.filter(credit => credit.req_status === 2 && credit.score <= 0),
      forSale: filteredAndSortedCredits.filter(credit => credit.req_status === 3 && !credit.is_expired),
      expired: filteredAndSortedCredits.filter(credit => credit.is_expired)
    };
  }, [filteredAndSortedCredits]);

  const LoadingCredit = () => (
    <li className="flex justify-between items-center py-3 pr-4 pl-3 text-sm animate-pulse">
      <div className="flex-1">
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-16">
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </li>
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please upload a valid PDF file.",
      });
    }
  };

  const openModal = (credit) => {

    setSelectedCredit(credit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setExpirationData({ creditName: "", amountReduced: "", password: "" });
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setExpirationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async () => {
    try {
      const { creditName, amountReduced, password } = expirationData;
      if (!creditName || !amountReduced || !password) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: "Please fill in all fields.",
        });
        return;
      }

      if (creditName !== selectedCredit.name) {
        Swal.fire({
          icon: "warning",
          title: "Name Error",
          text: "Name you entered doesn't match the credit name",
        });
        return;
      }

      const response = await verifyBeforeExpire(expirationData);
      console.log("verifyBeforeExpire says:", response.data["message"]);
      closeModal();
      await handleExpireCredit(selectedCredit.id);
    } catch (error) {
      console.error("Error expiring credit:", error.response?.data?.["message"] || error.message);
    }
  };

  const handleExpireCredit = async (creditId) => {
    console.log(`Expire credit called for credit ID: ${creditId}`);
    try {
      setPendingTx(creditId);
      const response = await expireCreditApi(creditId);
      console.log(response.data);
      await expireCredit(creditId);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Credit expired successfully!',
      });

      setCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_expired: true } : credit
        )
      );
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.response.data.message,
        });
      } else {
        console.error('Failed to expire credit:', error);
      }
    } finally {
      setPendingTx(null);
    }
  };

  const handlePutForSale = async (creditId) => {
    try {
      console.log(`Put for sale called for credit ID: ${creditId}`);

      // Find the credit with the matching ID
      const creditToSell = credits.find(credit => credit.id === creditId);

      if (!creditToSell) {
        throw new Error(`Credit with ID ${creditId} not found`);
      }

      console.log("Credit to sell:", creditToSell);
      await sellCredit(creditId, creditToSell.price);
      const response = await sellCreditApi({ credit_id: creditId, salePrice: creditToSell.price });
      console.log(response);

      // Refetch the updated credit list after successful creation
      const updatedCredits = await getNGOCredits();
      setCredits(updatedCredits.data);
    } catch (error) {
      console.error("Can't sell credit: ", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to sell credit: ${error.message}`
      });
    }
  };

  // Function to get status border style - using inline style
  const getStatusBorderStyle = (reqStatus, score, isExpired) => {
    // If expired, use a special style
    if (isExpired) return { borderLeft: '4px solid #415e02' }; // Green for expired

    // Use inline styles for borders to avoid potential CSS conflicts
    if (reqStatus === 1) return { borderLeft: '4px solid #FBBF24' }; // Yellow
    if (reqStatus === 2) {
      return score > 0 ? { borderLeft: '4px solid #10B981' } : { borderLeft: '4px solid #EF4444' }; // Green or Red
    }
    if (reqStatus === 3) return { borderLeft: '4px solid #3B82F6' }; // Blue
    return {}; // Default case
  };

  // Render a single credit item
  const renderCreditItem = (credit) => {
    // Merge background color style with border style
    const listItemStyle = {
      ...getStatusBorderStyle(credit.req_status, credit.score, credit.is_expired),
      backgroundColor: credit.is_expired ? '#D4EDDA' : 'transparent'
    };

    return (
      <li
        key={credit.id}
        className="flex justify-between items-center py-3 pr-4 pl-3 text-sm"
        style={listItemStyle}
      >
        <div className="flex flex-1 items-center w-0">
          <span className="flex-1 ml-2 w-0 truncate">
            Credit ID: {credit.id}: {credit.name} - Amount: {credit.amount || 'N/A'}, Price: {credit.price || 'N/A'} ETH
          </span>
        </div>

        {/* Document view button always visible */}
        {credit.secure_url && <button
          type='button'
          onClick={() => window.open(credit.secure_url, '_blank')}
          className="py-2 px-2 mr-2 font-sans text-white bg-green-500 rounded hover:bg-green-400"
        >
          <File size={20} />
        </button>}

        {/* Conditional rendering based on req_status and other conditions */}
        {!credit.is_expired && (
          <>
            {credit.req_status === 1 ? (
              <div className="flex items-center">
                <AlertTriangle className="mr-2 text-yellow-500" size={20} />
                <span className="text-sm">
                  Pending: {credit.auditor_left}/{credit.auditors_count} Auditors, Score: {credit.score}
                </span>
              </div>
            ) : credit.req_status === 2 ? (
              credit.score > 0 ? (
                <button
                  onClick={() => handlePutForSale(credit.id)}
                  className="py-1 px-3 ml-2 text-white bg-green-500 rounded hover:bg-green-400"
                >
                  <Tag className="inline mr-1" size={16} /> Put For Sale
                </button>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="mr-2 text-red-500" size={20} />
                  <span className="text-sm text-red-500">Rejected (Score: {credit.score})</span>
                </div>
              )
            ) : credit.req_status === 3 ? (
              <button
                onClick={() => openModal(credit)}
                className="py-1 px-3 ml-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: "#415e02" }}
              >
                {pendingTx === credit.id ? (
                  <span className='flex items-center'>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : 'Expire Credit'}
              </button>
            ) : (
              // Default case
              <button
                onClick={() => openModal(credit)}
                className="py-1 px-3 ml-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: "#415e02" }}
              >
                {pendingTx === credit.id ? (
                  <span className='flex items-center'>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : 'Expire Credit'}
              </button>
            )}
          </>
        )}

        {credit.is_expired && (
          <span className='flex items-center text-emerald-900'>
            <CheckCircle className="mr-1" size={16} />
            Expired!
          </span>
        )}
      </li>
    );
  };

  // Section header with counter and toggle capability
  const SectionHeader = ({ title, count, isExpanded, sectionKey, color }) => (
    <div
      className="flex justify-between items-center p-2 bg-gray-50 border-t border-gray-200 cursor-pointer first:border-t-0 hover:bg-gray-100"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center">
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span className="ml-1 font-medium" style={{ color }}>{title}</span>
      </div>
      <span className="py-1 px-2 text-xs bg-gray-200 rounded-full">{count}</span>
    </div>
  );

  // Render section
  const renderSection = (title, credits, sectionKey, color) => {
    if (!credits || credits.length === 0) return null;

    return (
      <div className="overflow-hidden mb-2 rounded-md border border-gray-200">
        <SectionHeader
          title={title}
          count={credits.length}
          isExpanded={expandedSections[sectionKey]}
          sectionKey={sectionKey}
          color={color}
        />
        {expandedSections[sectionKey] && (
          <ul className="divide-y divide-gray-200">
            {credits.map(credit => renderCreditItem(credit))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Professional Header with Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h3 className="text-lg leading-6 font-medium text-gray-900">My Credits</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              Manage and track your hydrogen credits
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => exportCredits('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search credits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="forSale">For Sale</option>
            <option value="expired">Expired</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="amount-desc">Amount High-Low</option>
            <option value="amount-asc">Amount Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="price-asc">Price Low-High</option>
          </select>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <File className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Credits
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Value
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${analytics.totalValue.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg. Price
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${analytics.averagePrice.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Accepted
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.accepted}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <dt className="text-sm font-medium text-gray-500">Credits List</dt>
        <dd className="mt-1 text-sm text-gray-900">
        {isLoading ? (
          <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
            <LoadingCredit key="loading-1" />
            <LoadingCredit key="loading-2" />
            <LoadingCredit key="loading-3" />
          </ul>
        ) : credits && credits.length > 0 ? (
          <div>
            {renderSection("Pending Requests", categorizedCredits.pending, "pending", "#FBBF24")}
            {renderSection("Accepted Requests", categorizedCredits.accepted, "accepted", "#10B981")}
            {renderSection("Rejected Requests", categorizedCredits.rejected, "rejected", "#EF4444")}
            {renderSection("For Sale", categorizedCredits.forSale, "forSale", "#3B82F6")}
            {renderSection("Expired Credits", categorizedCredits.expired, "expired", "#415e02")}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 rounded-md border border-gray-200">
            No credits available
          </div>
                  )}
        </dd>
      </div>

      {modalVisible && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-gray-800 bg-opacity-75">
          <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Expire Credit</h3>
            <div className="space-y-4">
              <input
                type="text"
                name="creditName"
                placeholder="Credit Name"
                className="p-2 w-full rounded border"
                value={expirationData.creditName}
                onChange={handleModalInputChange}
              />
              <input
                type="number"
                name="amountReduced"
                placeholder="Amount Reduced"
                className="p-2 w-full rounded border"
                value={expirationData.amountReduced}
                onChange={handleModalInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Your Password"
                className="p-2 w-full rounded border"
                value={expirationData.password}
                onChange={handleModalInputChange}
              />
              <br /><br /><br />
              <p className="mt-1 text-sm text-black-500">Add a document proof of expiration for Audit:</p>
              <input
                type="file"
                name="pdfFile"
                accept="application/pdf"
                className="p-2 w-full rounded border"
                onChange={handleFileChange}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="py-2 px-4 text-white bg-gray-500 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="py-2 px-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreditsList;
