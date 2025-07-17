import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MRPTag = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const tagRefs = useRef([]);

  // Fetch product data from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://inventorybackend-m1z8.onrender.com/api/product"
      );
      const result = await response.json();
      setProducts(result);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Generate PDF of all MRP tags
  const handleDownloadMRPTags = async () => {
    setLoading(true);
    setProgress(0);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [100, 50],
      });

      const totalTags = tagRefs.current.length;
      
      for (let i = 0; i < totalTags; i++) {
        const tag = tagRefs.current[i];
        if (tag) {
          const canvas = await html2canvas(tag);
          const imgData = canvas.toDataURL("image/png");
          if (i !== 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, 100, 50);
          
          // Update progress
          const currentProgress = Math.floor(((i + 1) / totalTags) * 100);
          setProgress(currentProgress);
        }
      }

      pdf.save("mrp-tags.pdf");
    } catch (error) {
      alert("Failed to download MRP Tags.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Download button and progress bar */}
      <div className="flex flex-col items-end mb-4 gap-2">
        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
            <div className="text-sm text-gray-600 mt-1 text-right">
              Generating: {progress}% completed
            </div>
          </div>
        )}
        <button
          onClick={handleDownloadMRPTags}
          disabled={loading || products.length === 0}
          className={`${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-md shadow`}
        >
          {loading ? `Generating... (${progress}%)` : "Download MRP Tags"}   
        </button>
      </div>

      {/* MRP Tag labels */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px]">
        {products.map((product, index) => {
          const ref = (el) => (tagRefs.current[index] = el);
          return (
            <div
              ref={ref}
              key={product._id}
              style={{
                width: "378px",
                height: "189px",
                padding: "10px",
                backgroundColor: "#fff",
                color: "#000",
                fontSize: "12px",
                fontFamily: "sans-serif",
                border: "1px solid #f2f2f2",
                borderRadius: "1rem",
                position: "relative",
              }}
              className="font-bold"
            >
              <p className="w-70">Product: {product.style_name}</p>
              <p>
                Brand: Qurvii | SKU: {product.style_code}
              </p>
              <p className="capitalize">
                Color: {product.color} | Size: {product.size}
              </p>
              <p>MRP: ₹{product.mrp || "NA"} (Incl. of all taxes)</p>
              <p>Net Qty: 1 | Unit: 1 Pcs</p>
              <p>
                MFG & MKT BY: Qurvii, 2nd Floor, B-149 <br/>Sector-6, Noida, UP,
                201301
              </p>
              <p>Contact: support@qurvii.com</p>
              <p className="absolute bottom-11 right-8">
                Style Code: {product.style_code}
              </p>
              <div className="absolute top-10 right-8">
                <QRCodeSVG value={product.style_code.toString()} size={80} level="H" />
              </div> 
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MRPTag;