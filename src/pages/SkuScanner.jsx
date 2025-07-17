import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SkuScanner = () => {
  const [skuInput, setSkuInput] = useState("");
  const [manualStyle, setManualStyle] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [scannedData, setScannedData] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);
  const [picklistId, setPicklistId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [picklistRecords, setPicklistRecords] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchStyle, setSearchStyle] = useState("");

  // Size options
 const sizes = [
  "select size",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];


  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("scannedSkuData");
    if (savedData) {
      setScannedData(JSON.parse(savedData));
    }
  }, []);

  // Auto-fetch product when manualStyle changes to 5 digits
  useEffect(() => {
    if (manualStyle.length === 5) {
      handleFetchProduct(manualStyle);
    } else {
      setProduct(null);
    }
  }, [manualStyle]);

  // Fetch picklist records when picklistId changes and is valid
  useEffect(() => {
    if (picklistId && picklistId.length >= 5) {
      fetchPicklistRecords(picklistId);
    }
  }, [picklistId]);

  const extractSkuData = (sku) => {
    const parts = sku.split("-");
    let styleNumber = "";
    let size = "";
    styleNumber = parts[0];
    size = parts.length === 2 ? parts[1]?.toUpperCase() : parts[2]?.toUpperCase();

    return { styleNumber, size };
  };

  const handleSkuInput = (e) => {
    const value = e.target.value;
    setSkuInput(value);

    if (value.includes("\n") || value.includes("\t")) {
      const cleanValue = value.replace(/[\n\t]/g, "").trim();
      processScannedSku(cleanValue);
    }
  };

  const processScannedSku = (sku) => {
    const { styleNumber, size } = extractSkuData(sku);

    if (styleNumber) {
      const newEntry = {
        sku,
        styleNumber,
        size: size || selectedSize,
        timestamp: new Date().toISOString(),
      };

      const updatedData = [...scannedData, newEntry];
      setScannedData(updatedData);
      localStorage.setItem("scannedSkuData", JSON.stringify(updatedData));

      if (size) setSelectedSize(size);

      if (styleNumber.length === 5) {
        handleFetchProduct(styleNumber);
      }

      setSkuInput("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualStyle || manualStyle.length !== 5) {
      alert("Please enter a valid 5-digit style number");
      return;
    }

    const newEntry = {
      sku: `${manualStyle}-${selectedSize}`,
      styleNumber: manualStyle,
      size: selectedSize,
      timestamp: new Date().toISOString(),
    };

    const updatedData = [...scannedData, newEntry];
    setScannedData(updatedData);
    localStorage.setItem("scannedSkuData", JSON.stringify(updatedData));

    setManualStyle("");
    setSelectedSize("");

    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const handleFetchProduct = async (styleNumber) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${styleNumber}`
      );
      const data = await response.json();
      if (data[0]) {
        setProduct(data[0]);
      } else {
        setProduct({
          style_id: styleNumber,
          brand: "Not Found",
          imageUrl: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPicklistRecords = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://app.nocodb.com/api/v2/tables/mdlwurhlg833g00/records`,
        {
          params: {
            where: `(picklist_id,eq,${id})`,
          },
          headers: {
            "xc-token": "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1",
          },
        }
      );

      const records = response.data.list || [];
      // Initialize status for each record
      const recordsWithStatus = records.map(record => ({
        ...record,
        status: "Cutting"
      }));
      setPicklistRecords(recordsWithStatus);
    } catch (err) {
      console.error("Error fetching picklist records:", err);
    } finally {
      setLoading(false);
    }
  };

  const scanComplete = async () => {
    if (!picklistId || !employeeId || scannedData.length === 0) {
      alert("Please enter picklist ID, employee ID and scan at least one item");
      return;
    }

    setSyncing(true);
    setSyncProgress(0);

    try {
      const ACCESS_TOKEN = "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1";
      const url = "https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records";

      // Get all records that need to be updated (those with status other than Pending)
    //   const recordsToUpdate = picklistRecords.filter(
    //     record => record.status !== "Pending"
    //   );

      // Create records in batches
      const batchSize = 10;
      for (let i = 0; i < picklistRecords.length; i += batchSize) {
        const batch = picklistRecords.slice(i, i + batchSize);
        await axios.post(
          url,
          batch.map(record => ({
            picklist_id: record.picklist_id,
            style_number: record.style_number,
            size: record.size,
            brand: record.brand,
            channel:record.channel,
            employee_id: employeeId,
            status: record.status,
            scanned_at: new Date().toISOString()
          })),
          {
            headers: {
              "xc-token": ACCESS_TOKEN,
              "Content-Type": "application/json",
            },
          }
        );
        
        setSyncProgress(Math.round(((i + batchSize) / picklistRecords.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Clear the scanned data after successful sync
        setScannedData([]);
        localStorage.removeItem("scannedSkuData");
      }, 3000);
    } catch (error) {
      console.error("❌ Failed to create records in NocoDB", error);
      alert("Error creating records in NocoDB");
    } finally {
      setSyncing(false);
      setSyncProgress(100);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      // Update local state first for immediate UI feedback
      setPicklistRecords(prevRecords =>
        prevRecords.map(record =>
          record.Id === id ? { ...record, status } : record
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteEntry = (index) => {
    const newData = [...scannedData];
    newData.splice(index, 1);
    setScannedData(newData);
    localStorage.setItem("scannedSkuData", JSON.stringify(newData));
  };

  const clearData = () => {
    localStorage.removeItem("scannedSkuData");
    setScannedData([]);
  };

  const handleSearchStyle = () => {
    if (searchStyle.length === 5) {
      handleFetchProduct(searchStyle);
    }
  };

  // Update record status based on scanned data
  useEffect(() => {
    if (picklistRecords.length > 0 && scannedData.length > 0) {
      setPicklistRecords(prevRecords =>
        prevRecords.map(record => {
          const isFound = scannedData.some(
            item =>
              Number(item.styleNumber) === record.style_number &&
              item.size === record.size
          );
          return {
            ...record,
            status: isFound ? "Found" : record.status
          };
        })
      );
    }
  }, [scannedData, picklistRecords]);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Filter unmatched items (status is not "Found")
  const unmatchedItems = picklistRecords.filter(
    record => record.status !== "Found"
  );

  // Filter matched items (status is "Found")
  const matchedItems = picklistRecords.filter(
    record => record.status === "Found"
  );

  return (
    <>
      <div className="flex gap-4 p-4 bg-gray-100 rounded-lg  mt-17">
        <input
          type="text"
          placeholder="Scan picklist id"
          onChange={(e) => setPicklistId(e.target.value)}
          value={picklistId}
          className="bg-white py-2 px-4 w-48 rounded outline-gray-300 border border-gray-300"
        />
        <input
          type="text"
          placeholder="Scan or Enter employee id"
          onChange={(e) => setEmployeeId(e.target.value)}
          value={employeeId}
          className="bg-white py-2 px-4 w-48 rounded outline-gray-300 border border-gray-300"
        />
        <button
          className={`${
            scannedData.length === 0 || !picklistId || !employeeId
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : "cursor-pointer bg-green-600 text-white hover:bg-green-700"
          } py-2 px-4 rounded transition-colors duration-75`}
          disabled={scannedData.length === 0 || !picklistId || !employeeId}
          onClick={scanComplete}
        >
          {syncing ? `Syncing... ${syncProgress}%` : "Scan Complete"}
        </button>
        {showSuccess && (
          <div className="flex items-center ml-4 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Data synced successfully!
          </div>
        )}
      </div>

      <div
        className={`w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 ${
          picklistId?.toString().length >= 5 && employeeId ? "block" : "hidden"
        }`}
      >
        {/* Left Column - Scanner */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">SKU Scanner</h1>

          {/* Style Search */}
         

          {/* Barcode Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Barcode or Enter Manually
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={skuInput}
              onChange={handleSkuInput}
              onKeyDown={(e) =>
                e.key === "Enter" && skuInput && processScannedSku(skuInput)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Scan barcode or enter SKU (e.g., 12020-3xl)"
            />
          </div>

          {/* Manual Entry Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Manual Entry</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style Number (5 digits)
              </label>
              <input
                type="text"
                value={manualStyle}
                onChange={(e) => setManualStyle(e.target.value)}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter 5-digit style number"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleManualSubmit}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!manualStyle || manualStyle.length !== 5}
            >
              Add Entry
            </button>
          </div>

          {/* Scanned Items List */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Recent Scans</h2>
              <button
                onClick={clearData}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>
            {scannedData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No items scanned yet
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scannedData
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
                            {item.styleNumber}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {item.size.toUpperCase()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <button
                              onClick={() =>
                                deleteEntry(scannedData.length - 1 - index)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Delete this entry"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Product Display and Items */}
        <div className="gap-4 flex">
          
          
        

          {/* Matched Items Section */}
          {matchedItems.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Found Items ({matchedItems.length})
              </h2>
              <div className="overflow-y-auto ">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Style
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchedItems.map((item) => (
                      <tr key={`${item.style_number}-${item.size}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
                          {item.style_number}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.size.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-semibold">
                          Found
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched Items Section */}
          {unmatchedItems.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Picklist Items ({unmatchedItems.filter((item)=> item?.status.toLowerCase() === "cutting" ).length})
              </h2>
              <div className="overflow-y-auto ">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Style
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unmatchedItems.map((item) => (
                      <tr key={`${item.style_number}-${item.size}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">
                          {item.style_number}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.size.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.status}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm space-x-1">
                          <button
                            onClick={() => updateStatus(item.Id, "No Fabric")}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200"
                          >
                            No Fab
                          </button>
                          <button
                            onClick={() => updateStatus(item.Id, "Cutting")}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded hover:bg-yellow-200"
                          >
                            Cutting
                          </button>
                          <button
                            onClick={() => updateStatus(item.Id, "Alter")}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                          >
                            Alter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SkuScanner;