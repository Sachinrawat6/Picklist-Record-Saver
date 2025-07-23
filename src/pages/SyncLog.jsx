import axios from "axios";
import { PulseLoader } from "react-spinners";
import { useGlobalContext } from "../context/PicklistRecordContext";
import fetchOrdersFromNocoDbWithSyncId from "../utility/FetchFromNocoDbWithSynId";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const SyncLog = () => {
  const { loading, syncLogData, error, fetchSyncLogData } = useGlobalContext();
  const [filteredData, setFilteredData] = useState([]);
  const [channelFilter, setChannelFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  console.log(syncLogData);

  useEffect(() => {
    // Apply filters whenever syncLogData or filter values change
    let result = syncLogData;

    if (channelFilter) {
      result = result.filter(record =>
        record.channel?.toLowerCase().includes(channelFilter.toLowerCase())
      )
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0);
      result = result.filter(record => {
        const recordDate = new Date(record.CreatedAt).setHours(0, 0, 0, 0);
        return recordDate === filterDate;
      });
    }

    setFilteredData(result);
  }, [syncLogData, channelFilter, dateFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-15">
        <PulseLoader color="#2563EB" size={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 mt-15 text-red-700 px-6 py-4 rounded-lg my-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-3a1 1 0 112 0v4a1 1 0 01-2 0V7zm1 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchSyncLogData}
          className="mt-3 text-sm font-medium text-red-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 mt-15 container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sync Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track all synchronized picklist records with NocoDb.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="channel-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Channel
            </label>
            {/* <input
              type="text"
              id="channel-filter"
              placeholder="Enter channel name"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            /> */}

            <select onChange={(e) => setChannelFilter(e.target.value)}
              className="border w-full bg-gray-100 py-2 px-4 rounded-md cursor-pointer outline-gray-300"
              value={channelFilter} >
              <option value="">Select Channel </option>
              <option value="Myntra">Myntra</option>
              <option value="Nykaa">Nykaa </option>
              <option value="Ajio">Ajio </option>
              <option value="Tatacliq">Tatacliq </option>
              <option value="Shopify">Shopify </option>
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear date filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                #
              </th>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                Channel
              </th>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                Picklist ID
              </th>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                Sync ID
              </th>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                Created At
              </th>
              <th className="text-left font-medium text-gray-700 px-6 py-3">
                Action{" "}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredData.length > 0 ? (
              filteredData.map((record, i) => (
                <tr
                  key={record.id || i}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-gray-900">{i + 1}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.channel || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.picklist_id || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {record.sync_id || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(record.CreatedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "-"}
                  </td>
                  <td>
                    <Link
                      to={`/sync-records/${record.sync_id}/${record.picklist_id}`}
                      className=" bg-green-100 py-2 px-4  rounded-md shadow-xs hover:bg-green-200 hover:text-green-900 duration-75 ease-in text-green-800"
                    >
                      Generate Files
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-6 text-gray-500 italic"
                >
                  {syncLogData.length === 0 ? "No sync records found." : "No records match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncLog;