import React from 'react'
import { Link } from 'react-router-dom'

const UploadOptions = () => {
  return (
    <div className = "mt-6 py-4 border-t border-t-gray-200 " >
        <h2 className="text-red-800 font-bold"> Generate Options </h2>
        <div className="mt-4 flex flex-col gap-2">

        <Link className="p-2 bg-pink-100 rounded-md hover:bg-pink-200 duration-75 ease-in" to="https://sachinrawat6.github.io/QrCode/" target="_blank"> Generate QR Code </Link>
        <Link className="p-2 bg-green-100 rounded-md hover:bg-green-200 duration-75 ease-in" to="https://mrptag.netlify.app/" target="_blank"> Generate MRP TAG </Link>
        </div>
    </div>
  )
}

export default UploadOptions