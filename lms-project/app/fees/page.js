'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default function FeesPage() {
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');

  useEffect(() => {
    fetchFeesData();
  }, []);

  async function fetchFeesData() {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to fetch fees data without the join
      const { data: feesDataOnly, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .order('created_at', { ascending: false });

      if (feesError) {
        console.error('Fees fetch error details:', feesError);
        throw new Error(`Failed to fetch fees: ${feesError.message}`);
      }

      console.log('Fees data fetched:', feesDataOnly?.length || 0, 'records');

      // If we have fees data, try to get student names
      if (feesDataOnly && feesDataOnly.length > 0) {
        // Get unique USNs
        const usns = [...new Set(feesDataOnly.map(fee => fee.usn).filter(usn => usn))];
        
        if (usns.length > 0) {
          // Fetch student details separately
          const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('usn, name, email, phone')
            .in('usn', usns);

          if (studentsError) {
            console.warn('Could not fetch student details:', studentsError);
          }

          // Merge the data
          const mergedData = feesDataOnly.map(fee => ({
            ...fee,
            students: studentsData?.find(student => student.usn === fee.usn) || null
          }));
          
          setFeesData(mergedData);
        } else {
          setFeesData(feesDataOnly);
        }
      } else {
        setFeesData([]);
      }
      
    } catch (err) {
      console.error('Error fetching fees data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate summary statistics
  const summary = feesData.reduce((acc, fee) => {
    acc.totalFees += Number(fee.Total_fees) || 0;
    acc.totalPaid += Number(fee.Paid_fees) || 0;
    acc.totalDue += Number(fee.Due_fees) || 0;
    return acc;
  }, { totalFees: 0, totalPaid: 0, totalDue: 0 });

  // Filter data based on search and payment mode
  const filteredData = feesData.filter(fee => {
    const matchesSearch = searchTerm === '' || 
      fee.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.students?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentMode = selectedPaymentMode === '' || fee.Payment_mode === selectedPaymentMode;
    return matchesSearch && matchesPaymentMode;
  });

  // Get unique payment modes for filter
  const paymentModes = [...new Set(feesData.map(fee => fee.Payment_mode).filter(mode => mode))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-700 font-semibold">Loading fees data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="text-red-600 text-xl font-semibold mb-2">Error Loading Data</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded">
            <p className="font-semibold">Troubleshooting tips:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>✓ Check if Supabase is connected</li>
              <li>✓ Verify environment variables are set</li>
              <li>✓ Ensure 'fees' table exists in database</li>
              <li>✓ Check Row Level Security (RLS) policies</li>
            </ul>
          </div>
          <button 
            onClick={() => fetchFeesData()} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Fees Management System
          </h1>
          <p className="text-gray-600 text-lg">Track and manage student fee records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase">Total Fees</p>
                <p className="text-3xl font-bold text-gray-800">₹{summary.totalFees.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase">Paid Fees</p>
                <p className="text-3xl font-bold text-green-600">₹{summary.totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase">Due Fees</p>
                <p className="text-3xl font-bold text-red-600">₹{summary.totalDue.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Student</label>
              <div className="relative">
                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by USN or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Payment Mode</label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Payment Modes</option>
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-xl">No fee records found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">USN</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Student Name</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white">Total Fees</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white">Paid Fees</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white">Due Fees</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Payment</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Due Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((fee, index) => {
                      const isDueDatePassed = fee.Upcoming_due_date && new Date(fee.Upcoming_due_date) < new Date();
                      const paymentPercentage = fee.Total_fees ? (Number(fee.Paid_fees) / Number(fee.Total_fees)) * 100 : 0;
                      
                      return (
                        <tr key={fee.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">{fee.usn}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{fee.students?.name || 'N/A'}</div>
                            {fee.students?.email && (
                              <div className="text-xs text-gray-500">{fee.students.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            ₹{Number(fee.Total_fees || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">₹{Number(fee.Paid_fees || 0).toLocaleString()}</div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${paymentPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span className={`font-bold ${Number(fee.Due_fees || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{Number(fee.Due_fees || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {fee.Last_payment_date ? new Date(fee.Last_payment_date).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {fee.Upcoming_due_date ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDueDatePassed 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isDueDatePassed && <span className="mr-1">⚠️</span>}
                                {new Date(fee.Upcoming_due_date).toLocaleDateString('en-IN')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {fee.Payment_mode && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {fee.Payment_mode}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer Stats */}
            <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
              <div className="bg-white rounded-lg px-4 py-2 shadow">
                Showing {filteredData.length} of {feesData.length} records
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow">
                Collection Rate: {summary.totalFees > 0 ? ((summary.totalPaid / summary.totalFees) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
