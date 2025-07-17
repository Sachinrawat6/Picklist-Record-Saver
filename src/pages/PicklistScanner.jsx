import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import QrScanner from 'qr-scanner';

const PicklistScanner = () => {
  const [picklistId, setPicklistId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize/cleanup barcode scanner
  useEffect(() => {
    if (scanning && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setPicklistId(result.data);
          setScanning(false);
          fetchPicklistRecords(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      scannerRef.current.start();

      return () => {
        scannerRef.current?.stop();
        scannerRef.current?.destroy();
      };
    }
  }, [scanning]);

  const fetchPicklistRecords = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`https://app.nocodb.com/api/v2/tables/mdlwurhlg833g00/records`, {
        params: {
          where: `(picklist_id,eq,${id})`
        },
        headers: {
          'xc-token': '-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1'
        }
      });
      
      setRecords(response.data.list || []);
    } catch (err) {
      setError('Failed to fetch records. Please try again.');
      console.error('Error fetching picklist records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (picklistId.trim()) {
      fetchPicklistRecords(picklistId.trim());
    }
  };

  const generateBarcode = () => {
    if (!picklistId) return null;
    
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, picklistId, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 16,
      margin: 10,
      height: 50,
    });
    
    return canvas.toDataURL();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-10">
      <div className="bg-white rounded-lg  p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Picklist Scanner</h1>
        
        {/* Input Section */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full">
              <label htmlFor="picklistId" className="block text-sm font-medium text-gray-700 mb-1">
                Picklist ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="picklistId"
                  value={picklistId}
                  onChange={(e) => setPicklistId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md  focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter or scan picklist ID"
                />
                <button
                  onClick={() => setScanning(!scanning)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scanning ? 'Cancel Scan' : 'Scan Barcode'}
                </button>
              </div>
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={!picklistId.trim() || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Fetch Records'}
            </button>
          </div>

          {/* Barcode Scanner */}
          {/* {scanning && (
            <div className="mt-4 border border-gray-200 rounded-md p-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-md"
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-blue-400 rounded-md pointer-events-none"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Point your camera at the picklist barcode
              </p>
            </div>
          )} */}

          {/* Generated Barcode Preview */}
          {picklistId && !scanning && (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">Picklist ID Barcode:</p>
              <img 
                src={generateBarcode()} 
                alt="Picklist ID Barcode" 
                className="h-20 border border-gray-200 p-2 bg-white"
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Records Table */}
        {!loading && records.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Records for Picklist ID: {picklistId}
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {records.length} items
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sr.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Style Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.style_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.channel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && picklistId && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No records found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No records found for picklist ID: {picklistId}
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && records.length === 0 && !picklistId && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Ready to scan
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a picklist ID manually or scan a barcode to view records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PicklistScanner;