import React, { useState, useEffect, useRef } from "react";

const SkuScanner = () => {
  const [skuInput, setSkuInput] = useState("");
  const [manualStyle, setManualStyle] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [scannedData, setScannedData] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);
  const [picklistId, setPicklistId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);

  // Size options
  const sizes = [
    "select size",
    "xxs",
    "xs",
    "s",
    "m",
    "l",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
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

  const extractSkuData = (sku) => {
    const parts = sku.split("-");
    let styleNumber = "";
    let size = "";

    if (parts.length >= 2) {
      styleNumber = parts[0];
      size = parts.find((part) => sizes.includes(part.toLowerCase())) || "";
    }

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
      setProduct({
        style_id: styleNumber,
        imageUrl: `https://assets.myntassets.com/v1/images/style/properties/${styleNumber}_1.jpg`,
      });

      const response = await fetch(
        `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${styleNumber}`
      );
      const data = await response.json();
      if (data[0]) {
        setProduct(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a single entry
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

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);




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
// save picklist records to nocodb 




  // const scanComplete = async () => {
  //   const confirm = window.prompt("Are you sure to want confirm scan done.?");
  //   if(!confirm){
  //     return
  //   }

  //   const payload = mergedData.map((item) => ({
  //     style_number: item.styleNumber,
  //     size: item.size,
  //     channel,
  //     picklist_id: picklistId,
  //     brand: item.Brand,
  //     status:"",
  //   }));

  //   try {
  //     const ACCESS_TOKEN = "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1";
  //     const url = "https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records";

  //     // Simulate progress
  //     const totalItems = payload.length;
  //     let processed = 0;
      
  //     const batchSize = 10;
  //     for (let i = 0; i < payload.length; i += batchSize) {
  //       const batch = payload.slice(i, i + batchSize);
  //       await axios.post(url, batch, {
  //         headers: {
  //           accept: "application/json",
  //           "content-type": "application/json",
  //           "xc-token": ACCESS_TOKEN,
  //         },
  //       });
        
  //       processed += batch.length;
  //       setSyncProgress(Math.round((processed / totalItems) * 100));
  //       await new Promise(resolve => setTimeout(resolve, 200));
  //     }

  //     setShowSuccess(true);
  //     setSyncCompleted(true); // Mark sync as completed
  //     setTimeout(() => setShowSuccess(false), 5000);
  //   } catch (error) {
  //     console.error("❌ Failed to sync to NocoDB", error);
  //     alert("Error syncing data to NocoDB");
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

const scanComplete = async () => {
  const confirmScan = window.confirm("Are you sure you want to confirm the scan is done?");
  if (!confirmScan) {
    return;
  }

  try {
    // Your existing scan complete logic
    const payload = scannedData.map((item) => ({
      style_number: item.styleNumber,
      size: item.size,
      channel: "your-channel-here", // Make sure to define this
      picklist_id: picklistId,
      brand: item.Brand || "", // Handle case where Brand might be undefined
      status: "scanned",
    }));

    const ACCESS_TOKEN = "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1";
    const url = "https://app.nocodb.com/api/v2/tables/mbce0t4pf72vu3j/records";

    // Simulate progress
    const totalItems = payload.length;
    let processed = 0;
    
    const batchSize = 10;
    for (let i = 0; i < payload.length; i += batchSize) {
      const batch = payload.slice(i, i + batchSize);
      await axios.post(url, batch, {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "xc-token": ACCESS_TOKEN,
        },
      });
      
      processed += batch.length;
      // Make sure setSyncProgress is defined if you're using it
      // setSyncProgress(Math.round((processed / totalItems) * 100));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Make sure these state setters are defined
    // setShowSuccess(true);
    // setSyncCompleted(true);
    // setTimeout(() => setShowSuccess(false), 5000);
    
    alert("Scan completed successfully!");
  } catch (error) {
    console.error("❌ Failed to sync to NocoDB", error);
    alert("Error syncing data to NocoDB");
  } finally {
    // setSyncing(false); // Make sure this is defined
  }
};

// In your button JSX:

  return (
    <>
      <div className="flex gap-4 truncate">
        <input type="number" placeholder="Scan picklist id"
        onChange={(e)=>setPicklistId(e.target.value)}
        value={picklistId}
        className="bg-white py-2 px-4 w-lg rounded outline-gray-300 cursor-pointer"
        
        />
         <input type="number" placeholder="Scan or Enter employee id"
        onChange={(e)=>setEmployeeId(e.target.value)}
        value={employeeId}
        className="bg-white py-2 px-4 w-lg rounded outline-gray-300 cursor-pointer"
        
        />
        {/* <button
  className={`${
    scannedData.length === 0
      ? "cursor-not-allowed bg-gray-100 text-gray-400"
      : "cursor-pointer bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
  } py-2 px-4 rounded transition-colors duration-75`}
  disabled={scannedData.length === 0}
  onClick={() => {
    if (scannedData.length > 0) {
      // Add your scan complete logic here
      scanComplete()
      console.log("Scan complete with data:", scannedData);
    }
  }}
>
  Scan Complete
</button> */}

<button
  className={`${
    scannedData.length === 0
      ? "cursor-not-allowed bg-gray-100 text-gray-400"
      : "cursor-pointer bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
  } py-2 px-4 rounded transition-colors duration-75`}
  disabled={scannedData.length === 0}
  onClick={scanComplete} // Directly use the function here
>
  Scan Complete
</button>
      </div>
      <div className={`container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 ${picklistId?.toString().length >= 5 && employeeId ? "block" :"hidden"}`}>
        {/* Left Column - Scanner */}
        <div className="bg-white rounded-lg p-6 ">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">SKU Scanner</h1>

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
              <div className="max-h-64 overflow-y-auto  rounded-lg">
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

        {/* Right Column - Product Display */}
        <div className="bg-white rounded-lg p-6 ">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Product Display
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : product ? (
            <div className="h-full">
              <div className="mb-4 flex justify-center">
                <iframe
                  width="100%"
                  className="h-[64vh]"
                  src={`https://www.myntra.com/coats/qurvii/title/${product.style_id}/buy`}
                  title="Product Display"
                  
                ></iframe>
              </div>

              <a
                href={`https://www.myntra.com/coats/qurvii/title/${product.style_id}/buy`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                View on Myntra
              </a>
            </div>
          ) : (
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
                No product displayed
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a 5-digit style number to view product
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SkuScanner;
