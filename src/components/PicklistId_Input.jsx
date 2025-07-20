import React from 'react'

const PicklistIdInput = ({setPicklistId,picklistId,fetchOrders,syncOrder}) => {
  return (
    <div>
        <h2>Scan Picklist Id</h2>
        <div className="flex justify-between mt-2 items-cente">
        <form onSubmit={fetchOrders}>
        <input type="number" placeholder="Scan Picklist Id "
        // onSubmit={fetchOrders}
        className='bg-gray-200 py-2 px-4 rounded outline-gray-300 cursor-pointer'
        onChange={(e)=>setPicklistId(e.target.value)}
        value={picklistId}
        />
        </form>
        <div className={`${picklistId?.toString().length > 4  ? "block" : "hidden"}`}>
          <button
          className="bg-green-100 text-green-800 py-2 px-4 rounded-md hover:bg-green-200 hover:text-green-900 duration-75 ease-in cursor-pointer"
          onClick={()=> syncOrder()}>Sync Orders</button>
        </div>
        </div>
    </div>
  )
}

export default PicklistIdInput