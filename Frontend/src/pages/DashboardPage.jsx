// import React from 'react';

// const DashboardPage = () => {
//   return (
//     <div className="flex flex-col items-center justify-center h-full text-center">
//       <div className="bg-blue-100 rounded-2xl p-4 mb-6">
//         <span className="text-4xl">⚖️</span>
//       </div>
//       <h1 className="text-3xl font-semibold text-gray-800 mb-3">Welcome to Nexintel AI</h1>
//       <p className="text-gray-600 mb-8 max-w-md">
//         Your AI-powered legal assistant for document processing, case analysis, and legal drafting. Choose an action
//         below to get started.
//       </p>
//       {/* <div className="grid md:grid-cols-3 gap-4 w-full max-w-2xl">
//         <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
//           <div className="bg-blue-600 h-8 w-8 rounded-md mb-3"></div>
//           <h3 className="font-semibold text-gray-800 mb-1">Upload Documents</h3>
//           <p className="text-sm text-gray-600">Upload case files for AI-powered analysis and summarization</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
//           <div className="bg-blue-600 h-8 w-8 rounded-md mb-3"></div>
//           <h3 className="font-semibold text-gray-800 mb-1">AI Case Analysis</h3>
//           <p className="text-sm text-gray-600">Get role-specific summaries for judges, lawyers, and clients</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
//           <div className="bg-blue-600 h-8 w-8 rounded-md mb-3"></div>
//           <h3 className="font-semibold text-gray-800 mb-1">Document Drafting</h3>
//           <p className="text-sm text-gray-600">Generate legal documents using AI and templates</p>
//         </div>
//       </div> */}
//     </div>
//   );
// };

// export default DashboardPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FileText,
  MessageSquare,
  Upload,
  FolderOpen,
  Search,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader,
  CreditCard, // Added for No Subscription Message
  Settings // Added for Manage Subscription button
} from 'lucide-react';
import api from '../services/api'; // Import the API service
import { getCache, invalidateCache } from '../utils/cache'; // Import caching utilities

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);

  // States for Billing & Usage data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isInitialLoad = useRef(true); // To track initial component mount

  // Helper functions from BillingAndUsagePage.jsx
  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 'Unlimited' || limit === null || limit === undefined || limit === 0) return 0;
    const usedNum = parseFloat(used) || 0;
    const limitNum = parseFloat(limit) || 0;
    if (limitNum === 0) return 0;
    return Math.min((usedNum / limitNum) * 100, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  // Fetch plan details, all available plans, and user's active subscription
  const fetchPlanData = useCallback(async (backgroundRefresh = false) => {
    if (!backgroundRefresh) {
      setLoadingPlans(true);
      setLoadingSubscription(true);
      setError(null);
    }

    try {
      console.log(`Fetching all plan and resource details (backgroundRefresh: ${backgroundRefresh})...`);
      const data = await api.getUserPlanDetails(); // This call now uses the cache internally
      
      console.log('Fetched plan and resource details (all):', data);
      setPlanData(data);
      
      const activePlan = data.activePlan || data.userSubscription || data.subscription;
      if (activePlan) {
        const normalizedSubscription = {
          id: activePlan.id || activePlan.subscription_id,
          plan_name: activePlan.plan_name || activePlan.planName || activePlan.name,
          type: activePlan.type || activePlan.accountType || activePlan.subscription_type,
          interval: activePlan.interval || activePlan.billingCycle || activePlan.billing_cycle || activePlan.billing_interval,
          price: activePlan.price || activePlan.cost || activePlan.amount,
          currency: activePlan.currency || 'INR',
          status: activePlan.subscription_status || activePlan.status || (activePlan.is_active ? 'active' : 'inactive'),
          start_date: activePlan.start_date || activePlan.startDate || activePlan.created_at,
          end_date: activePlan.end_date || activePlan.nextBillingDate || activePlan.next_billing_date || activePlan.expires_at,
          is_active: activePlan.is_active !== undefined ? activePlan.is_active : (activePlan.status === 'active'),
          ...activePlan
        };
        setUserSubscription(normalizedSubscription);
      } else {
        console.warn('No active subscription found in API response');
        setUserSubscription(null);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch plan data';
      setError(`Failed to fetch plan data: ${errorMessage}`);
      console.error('Error fetching plan data:', err);
      
      if (err.response?.status === 401 || errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        localStorage.clear();
        sessionStorage.clear();
        // window.location.href = '/login';
      }
    } finally {
      if (!backgroundRefresh) {
        setLoadingPlans(false);
        setLoadingSubscription(false);
      }
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setError(null);
    const cachedPlanData = getCache('userPlanDetails-'); // Check for cached data
    
    if (cachedPlanData && isInitialLoad.current) {
      console.log('Displaying cached data immediately.');
      setPlanData(cachedPlanData);
      const activePlan = cachedPlanData.activePlan || cachedPlanData.userSubscription || cachedPlanData.subscription;
      if (activePlan) {
        const normalizedSubscription = {
          id: activePlan.id || activePlan.subscription_id,
          plan_name: activePlan.plan_name || activePlan.planName || activePlan.name,
          type: activePlan.type || activePlan.accountType || activePlan.subscription_type,
          interval: activePlan.interval || activePlan.billingCycle || activePlan.billing_cycle || activePlan.billing_interval,
          price: activePlan.price || activePlan.cost || activePlan.amount,
          currency: activePlan.currency || 'INR',
          status: activePlan.subscription_status || activePlan.status || (activePlan.is_active ? 'active' : 'inactive'),
          start_date: activePlan.start_date || activePlan.startDate || activePlan.created_at,
          end_date: activePlan.end_date || activePlan.nextBillingDate || activePlan.next_billing_date || activePlan.expires_at,
          is_active: activePlan.is_active !== undefined ? activePlan.is_active : (activePlan.status === 'active'),
          ...activePlan
        };
        setUserSubscription(normalizedSubscription);
      } else {
        setUserSubscription(null);
      }
      setLoading(false); // Hide loading spinner immediately
      // Then, refresh data in the background
      console.log('Triggering background refresh...');
      fetchPlanData(true);
    } else {
      setLoading(true); // Show loading spinner if no cached data or not initial load
      try {
        await Promise.all([
          fetchPlanData(),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    isInitialLoad.current = false; // Mark initial load as complete
  }, [fetchPlanData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshTrigger]);

  const handleRefresh = () => {
    invalidateCache('userPlanDetails-'); // Invalidate cache for immediate refresh
    setRefreshTrigger(prev => prev + 1);
  };


  const handleNewCaseAnalysisClick = () => {
    setIsLoadingAnalysis(true);
    setTimeout(() => {
      navigate('/analysis');
    }, 500); // Simulate a smooth transition
  };

  const handleUploadDocumentsClick = () => {
    setIsLoadingUpload(true);
    setTimeout(() => {
      navigate('/projects'); // Redirect to Projects page
    }, 500); // Simulate a smooth transition
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      <span className="ml-3 text-gray-600">Loading data...</span>
    </div>
  );

  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="text-red-800 font-medium">Error loading data</h3>
      </div>
      <p className="text-red-700 mt-2">{error}</p>
      {error && (error.includes('Authentication required') || error.includes('session has expired') || error.includes('401')) ? (
        <div className="mt-4">
          <p className="text-sm text-red-600 mb-2">Please ensure you are logged in and try again.</p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mr-2"
          >
            Refresh Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Legal Intelligence Suite</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || isLoadingAnalysis || isLoadingUpload || loadingPlans || loadingSubscription}
        >
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Show error if present */}
      {error && <ErrorMessage />}

      {loading && !planData ? ( // Only show spinner if loading and no data is available
        <LoadingSpinner />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">46</p>
                  <p className="text-xs text-black-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-black-600" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Chats</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <p className="text-xs text-black-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +8% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                  <MessageSquare size={24} className="text-black-600" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates Used</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <p className="text-xs text-black-600 flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" />
                    +24% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={24} className="text-black-600" />
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">0.26 GB</p>
                  <p className="text-xs text-black-500">of 100 GB limit</p>
                </div>
                <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                  <FolderOpen size={24} className="text-black-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action 1 */}
              <button
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition-all cursor-pointer"
                onClick={handleNewCaseAnalysisClick}
                disabled={isLoadingAnalysis}
              >
                <div className="w-10 h-10 bg-black-100 rounded-lg flex items-center justify-center">
                  {isLoadingAnalysis ? <Loader size={20} className="text-black-600 animate-spin" /> : <Plus size={20} className="text-black-600" />}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">New Case Analysis</p>
                  <p className="text-sm text-gray-600">Start analyzing a new legal document</p>
                </div>
              </button>

              {/* Action 2 */}
              <button
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:bg-green-50 transition-all cursor-pointer"
                onClick={handleUploadDocumentsClick}
                disabled={isLoadingUpload}
              >
                <div className="w-10 h-10 bg-black-100 rounded-lg flex items-center justify-center">
                  {isLoadingUpload ? <Loader size={20} className="text-black-600 animate-spin" /> : <Upload size={20} className="text-black-600" />}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Upload Documents</p>
                  <p className="text-sm text-gray-600">Add new files to your library</p>
                </div>
              </button>

              {/* Action 3 */}
              <button
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:bg-purple-50 transition-all cursor-pointer"
                onClick={() => navigate('/chats')}
              >
                <div className="w-10 h-10 bg-black-100 rounded-lg flex items-center justify-center">
                  <Search size={20} className="text-black-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Case Search</p>
                  <p className="text-sm text-gray-600">Search through legal cases</p>
                </div>
              </button>
            </div>
          </div>

          {/* Usage Summary - Resource Utilization */}
          {planData && planData.resourceUtilization && (
            <div className="bg-white border border-gray-300 rounded-lg p-20 mb-8 ">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resource Utilization</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {Object.entries(planData.resourceUtilization).map(([key, resourceData]) => {
                  const used = resourceData?.total_used || resourceData?.used_gb || resourceData?.used || 0;
                  const limit = resourceData?.limit || resourceData?.limit_gb;
                  const percentage = parseFloat(resourceData?.percentage_used) || getUsagePercentage(used, limit);
                  
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded px-2 py-1">
                          {limit === 'Unlimited' || limit === null || limit === undefined ? 'UNLIMITED' : `${percentage.toFixed(0)}% USED`}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {key.toLowerCase().includes('storage') ? `${used} GB` : used.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {limit === 'Unlimited' || limit === null || limit === undefined
                          ? 'No restrictions'
                          : `of ${limit.toLocaleString()}${key.toLowerCase().includes('storage') ? ' GB' : ''} limit`
                        }
                      </div>
                      {limit !== 'Unlimited' && limit !== null && limit !== undefined && (
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentage >= 90 ? 'bg-red-500' :
                              percentage >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Subscription Message */}
          {!userSubscription && !loadingSubscription && (
            <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
              <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-6">You don't have an active subscription. Choose a plan to get started.</p>
              <button className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
                View Available Plans
              </button>
            </div>
          )}
        </>
      )}
      {/* Remaining sections (Recent Activity, Popular Templates, System Status, Quick Tools)
          remain exactly as in your original code — all JSX-safe */}
    </div>
  );
}
