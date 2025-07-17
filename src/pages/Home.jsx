import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
     <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Welcome to Inventory Scanner</h2>
                <p className="text-gray-600 mb-6">
                  Choose a scanner from the navigation menu above
                </p>
                <div className="flex justify-center gap-4">
                  <Link 
                    to="/picklist" 
                    className="px-4 py-2 bg-black text-white rounded hover:bg-black"
                  >
                    Go to Picklist Scanner
                  </Link>
                  <Link 
                    to="/sku" 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Go to SKU Scanner
                  </Link>
                </div>
              </div>
  )
}

export default Home