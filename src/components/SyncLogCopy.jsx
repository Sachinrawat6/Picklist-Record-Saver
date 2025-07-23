import axios from "axios";
import { PulseLoader } from "react-spinners";
import { useGlobalContext } from "../context/PicklistRecordContext";
import fetchOrdersFromNocoDbWithSyncId from "../utility/FetchFromNocoDbWithSynId";
import { Link } from "react-router-dom";
const SyncLog = () => {
    const { loading, syncLogData, error, fetchSyncLogData } = useGlobalContext();
    console.log(syncLogData);



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
                        {syncLogData.length > 0 ? (
                            syncLogData.map((record, i) => (
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
                                    colSpan={4}
                                    className="text-center py-6 text-gray-500 italic"
                                >
                                    No sync records found.
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
