import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import patternData from "../csvjson.json";
import UploadOptions from './UploadOptions';
import syncOrdersToNocoDb from "../utility/SyncOrderToNocoDb"
import axios from "axios"

const SideBar = ({ syncOrders, picklistRecords }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [alterSyncOrders,setAlterSyncOrder] = useState([]);
  const pendingCount = syncOrders.filter((o) => o.status === "pending").length;
  const shippedCount = syncOrders.filter((o) => o.status === "shipped").length;
  const alterCount = picklistRecords.filter((o) => o.status.toLowerCase() === "alter").length;
  const noFabricCount = picklistRecords.filter((o) => o.status.toLowerCase() === "no fabric").length;
  



  const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

  // Original Cutting Summary PDF export
  const exportToPDF = (data, patternData, fileName = 'Cutting_List') => {
    const summaryMap = {};

    data
      .filter((o) => o?.status?.toLowerCase()?.includes("pending"))
      .forEach(order => {
        const style = Number(order.style_number);
        const size = order.size;
        const patternInfo = patternData.find(p => p.style_number === style) || {};
        const pattern = patternInfo.pattern || '';
        const key = `${pattern}-${style}`;

        if (!summaryMap[key]) {
          summaryMap[key] = {
            '#Pattern': pattern,
            'Style': style,
            ...Object.fromEntries(sizes.map(size => [size, 0])),
            'Total': 0
          };
        }

        if (summaryMap[key][size] !== undefined) {
          summaryMap[key][size]++;
          summaryMap[key]['Total']++;
        }
      });

    // Prepare table data
    const tableData = Object.values(summaryMap).map(row => ([
      row['#Pattern'], row['Style'],
      ...sizes.map(size => row[size] || ""),
      row['Total']
    ]));

    // Add a grand total row
    const totalRow = [
      'Grand Total', '',
      ...sizes.map(size => {
        return tableData.reduce((sum, row) => sum + (parseInt(row[sizes.indexOf(size) + 2]) || 0), 0);
      }),
      tableData.reduce((sum, row) => sum + (parseInt(row[sizes.length + 2]) || 0), 0)
    ];

    tableData.push(totalRow);

    // Create PDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Cutting List Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

    autoTable(doc, {
      startY: 30,
      head: [['#Pattern', 'Style', ...sizes, 'Total']],
      body: tableData,
      styles: { halign: 'center', lineWidth: 0.1, lineColor: 10 },
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
    });

    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Special Status PDF export (simplified version)
  const exportSpecialStatusToPDF = (data, status, fileName) => {
    const filteredData = data.filter((o) => o?.status?.toLowerCase() === status.toLowerCase());
    
    if (filteredData.length === 0) {
      alert(`No ${status} orders found`);
      return;
    }

    // Prepare table data with only required fields
    const tableData = filteredData.map(order => ([
      order.channel || 'NA',
      order.picklist_id || '',
      order.style_number || '',
      order.size || ''
    ]));

    // Create PDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${status} Report`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

    autoTable(doc, {
      startY: 30,
      head: [['Channel', 'Picklist ID', 'Style Number', 'Size']],
      body: tableData,
      styles: { halign: 'center', lineWidth: 0.1, lineColor: 10 },
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
    });

    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // QR Code Sheet
  const downloadQRCodeSheet = () => {
    const foundOrders = syncOrders?.length > 0 
      ? syncOrders.filter((order) => order.status?.toLowerCase().includes("pending"))
      : [];

    if (foundOrders.length === 0) {
      alert('No found orders available for MRP tags');
      return;
    }

    const headers = [
      "Channel", "Style Number", "Size", "Color", "Brand", "Date", "Pattern#", 
      "Style Type", "Style Name", "Style 1", "Style 2", "Accessory 1", 
      "Accessory 2", "Wash Care", "(Do not touch) Order Id", "image 100x100 qr image"
    ];

    const csvRows = [headers.join(',')];

    foundOrders.forEach(order => {
      const pattern = patternData.find((o) => o.style_number === order.style_number) || {};
      const row = [
        `"${order.channel || 'NA'}"`,
        `"${order.style_number || ''}"`,
        `"${order.size || ''}"`,
        `"${pattern.color || "Other"}"`,
        `"${order.brand || 'Qurvii'}"`,
        `"${order.created_at || new Date().toLocaleString()}"`,
        `"${pattern.pattern || "NA"}"`,
        `"${pattern.style_type || "NA"}"`,
        `"${pattern.style_name || "Qurvii Products"}"`,
        `"${pattern.style_1 || ""}"`,
        `"${pattern.style_2 || ""}"`,
        `"${pattern.accessory1 || ""}"`,
        `"${pattern.accessory2 || ""}"`,
        `"${pattern.wash_care || ""}"`,
        `"${order.order_id || ''}"`,
        `"https://quickchart.io/qr?text=${order.order_id || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QR_CODE_SHEET${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MRP Tags
//   const downloadMRPTags = (status, dataSource) => {
//  let foundOrders;

    
   

//     if(status?.toLowerCase().trim() === 'alter' || status?.toLowerCase().trim() === 'no fabric'){
//       const syncToNocoDb = async()=>{
//         const response = await syncOrdersToNocoDb(dataSource,patternData)
//         setAlterSyncOrder(response);
//         console.log(response)
//         foundOrders = response? response : dataSource.filter(
//       (o) => o?.status?.toLowerCase() === status?.toLowerCase()
//     );
        
//       }
//     }

//      if (foundOrders?.length === 0) {
//       alert(`No orders found with status "${status}"`);
//       return;
//     }

   


//     const headers = [
//       "Style Number", "Size", "Color", "Brand",
//       "Style Name", "(Do not touch) Order Id", "image 100x100 qr image"
//     ];

//     const csvRows = [headers.join(',')];

//     foundOrders.forEach(order => {
//       const pattern = patternData.find(
//         (p) => p.style_number === order.style_number
//       ) || {};

//       const row = [
//         `"${order.style_number || ''}"`,
//         `"${order.size || ''}"`,
//         `"${pattern.color || 'Other'}"`,
//         `"${order.brand || 'Qurvii'}"`,
//         `"${pattern.style_name || 'Qurvii Products'}"`,
//         `"${order.order_id || ''}"`,
//         `"https://quickchart.io/qr?text=${order.order_id || ''}"`
//       ];

//       csvRows.push(row.join(','));
//     });

//     const csvContent = csvRows.join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);

//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute(
//       'download',
//       `MRP_Tags_${status}_${new Date().toISOString().split('T')[0]}.csv`
//     );
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };



const downloadMRPTags = async (status, dataSource) => {
  let foundOrders;

  if (status?.toLowerCase().trim() === 'alter' || status?.toLowerCase().trim() === 'no fabric') {
    const confirm = window.confirm(`Are you sure want to sync and download MRT tag of [ ${status.toUpperCase()} ] styles`)
    if(!confirm){
      return
    }
    try {
      // Assuming syncOrdersToNocoDb is an async function that returns the synced orders
      const alterData = dataSource.filter((o)=>o?.status.toLowerCase().includes("alter"));
      const response = await syncOrdersToNocoDb(alterData, patternData);
      setAlterSyncOrder(response);
      // console.log(response.all_orders)
      foundOrders = response?.all_orders;
      
      
    } catch (error) {
      console.error("Error syncing orders:", error);
      foundOrders = dataSource.filter(
        (o) => o?.status?.toLowerCase() === status?.toLowerCase()
      );
    }
  } else {
    foundOrders = dataSource.filter(
      (o) => o?.status?.toLowerCase() === status?.toLowerCase()
    );
  }

  if (!foundOrders || foundOrders.length === 0) {
    alert(`No orders found with status "${status}"`);
    return;
  }

  const headers = [
    "Style Number", "Size", "Color", "Brand",
    "Style Name", "(Do not touch) Order Id", "image 100x100 qr image"
  ];

  const csvRows = [headers.join(',')];

  foundOrders.forEach(order => {
    const pattern = patternData.find(
      (p) => p.style_number === order.style_number
    ) || {};

    const row = [
      `"${order.style_number || ''}"`,
      `"${order.size || ''}"`,
      `"${pattern.color || 'Other'}"`,
      `"${order.brand || 'Qurvii'}"`,
      `"${pattern.style_name || 'Qurvii Products'}"`,
      `"${order.order_id || ''}"`,
      `"https://quickchart.io/qr?text=${order.order_id || ''}"`
    ];

    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `MRP_Tags_${status}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  return (
    <div className="bg-white p-6 mt-15 rounded-lg shadow-sm border border-gray-100">
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports</h3>
        <div className="space-y-3">
          {/* Cutting Summary Button */}
          <button
            onClick={() => exportToPDF(syncOrders, patternData, "Cutting Summary")}
            className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>Cutting Summary</span>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                {pendingCount}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {/* MRP Tags Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border border-green-100 text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200 text-sm font-medium"
            >
              <span>Download Tags</span>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Cutting: {pendingCount}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Shipped: {shippedCount}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-green-600 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <ul className="py-1">
                  <li
                    onClick={() => {
                      downloadMRPTags('pending', syncOrders);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm"
                  >
                    <span>Cutting Tags</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                      {pendingCount}
                    </span>
                  </li>
                  <li
                    onClick={() => {
                      downloadMRPTags('shipped', syncOrders);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm"
                  >
                    <span>Shipped Tags</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      {shippedCount}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* QR Code Sheet Button */}
          <button
            onClick={downloadQRCodeSheet}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 border border-purple-100 text-purple-800 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>QR Code Sheet</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Special Status Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Special Status</h3>
        <div className="space-y-2">
          <button
            onClick={() => exportSpecialStatusToPDF(picklistRecords, 'alter', 'Alter_Report')}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>Alter Report (PDF)</span>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                {alterCount}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
           <button
            onClick={() => exportSpecialStatusToPDF(picklistRecords, 'no fabric', 'No_Fabric_Report')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>No Fabric Report (PDF)</span>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                {noFabricCount}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
          
          <button
            onClick={() => downloadMRPTags('alter', picklistRecords)}
            className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 border border-orange-100 text-orange-800 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>Alter Tags (CSV)</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
              {alterCount}
            </span>
          </button>

         

          <button
            onClick={() => downloadMRPTags('no fabric', picklistRecords)}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
          >
            <span>No Fabric Tags (CSV)</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {noFabricCount}
            </span>
          </button>
        </div>
      </div>

      {/* Upload Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload</h3>
        <UploadOptions />
      </div>
    </div>
  );
};

export default SideBar;