import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Logo placeholder - replace with your actual logo */}
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Inventory Scanner</h1>
        <p className="text-lg text-gray-600 mb-8">
          Streamline your inventory management with our scanning solutions
        </p>
        
        <div className="space-y-4">
          <Link
            to="/sync-log"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Sync Log
          </Link>
          
          <Link
            to="/sku"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-sm"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
            </svg>
            SKU Scanner
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          Need help? <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default Home;