import React from 'react'

const PicklistIdInput = ({setPicklistId,picklistId,fetchOrders}) => {
  return (
    <div>
        <h2>Scan Picklist Id</h2>
        <form onSubmit={fetchOrders}>
        <input type="number" placeholder="Scan Picklist Id "
        // onSubmit={fetchOrders}
        className='bg-gray-200 py-2 px-4 rounded outline-gray-300 cursor-pointer'
        onChange={(e)=>setPicklistId(e.target.value)}
        value={picklistId}
        />
        </form>
    </div>
  )
}

export default PicklistIdInput