import React, { useEffect, useState } from 'react'

const Iframe = ({style_number}) => {
const [loading , setLoading] = useState(false);
const [product, setProduct ] = useState([]);
    
  const handleFetchProduct = async (e) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${
          Number(style_number)
        }`
      );
      const data = await response.json();
      setProduct(data[0]);
    } catch (error) {
      console.log("Failed to fetch prodcut details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(style_number.toString().length === 5){
        handleFetchProduct();

    }
    // handleFetchProduct();
  },[]);
    
  return (
      <div
          className={`right   px-6 rounded-2xl shadow-xs ${
            product?.style_id && !loading ? "block" : "hidden"
          }`}
        >
          <div className="overflow-hidden">
            <iframe
            //   style={{ display: !loading ? "block" : "none" }}
              className="w-full h-[100vh] -mt-48"
              src={`https://www.myntra.com/coats/qurvii/title/${product?.style_id}/buy`}
              frameborder="0"
            ></iframe>
          </div>
        </div>
  )
}

export default Iframe