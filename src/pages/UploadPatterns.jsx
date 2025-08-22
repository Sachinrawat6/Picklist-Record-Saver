import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';

const PatternUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const API_URL = "https://inventorybackend-m1z8.onrender.com/api/v1/cutting-list/upload";

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'text/csv': ['.csv']
        },
        maxFiles: 1,
        onDrop: acceptedFiles => {
            setFile(acceptedFiles[0]);
            setUploadResult(null);
            setError(null);
        }
    });

    const setDefaultNA = (data) => {
        return data.map(item => {
            const newItem = {};
            // List of all possible fields from your backend
            const fields = [
                'style_number', 'pattern', 'style_type', 'color',
                'style_name', 'accessory1', 'wash_care', 'mrp'
            ];

            fields.forEach(field => {
                newItem[field] = item[field] === undefined || item[field] === null || item[field] === ''
                    ? 'NA'
                    : item[field];
            });
            return newItem;
        });
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a CSV file first');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Parse CSV file
            Papa.parse(file, {
                header: true,
                complete: async (results) => {
                    try {
                        // Set default NA for empty fields
                        const processedData = setDefaultNA(results.data);

                        // Upload with progress tracking
                        const response = await axios.post(API_URL, processedData, {
                            onUploadProgress: (progressEvent) => {
                                const percentCompleted = Math.round(
                                    (progressEvent.loaded * 100) / progressEvent.total
                                );
                                setUploadProgress(percentCompleted);
                            }
                        });

                        setUploadResult(response.data);
                    } catch (err) {
                        setError(err.response?.data?.message || 'Failed to upload patterns');
                    } finally {
                        setUploading(false);
                        setUploadProgress(0);
                    }
                },
                error: (error) => {
                    setError('Error parsing CSV: ' + error.message);
                    setUploading(false);
                    setUploadProgress(0);
                }
            });
        } catch (err) {
            setError('An unexpected error occurred');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setFile(null);
        setUploadResult(null);
        setError(null);
        setUploadProgress(0);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-18">
            <h2 className="text-2xl font-bold text-purple-800 mb-6">Upload Pattern Data</h2>

            <div className="mb-6">
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-500'
                        }`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <p className="text-black">{file.name} selected</p>
                    ) : (
                        <div>
                            <p className="text-black mb-2">Drag & drop a CSV file here, or click to select</p>
                            <p className="text-sm text-gray-500">CSV should contain style_number, pattern, style_type, color, style_name, accessory1, wash_care, mrp</p>
                            <p className="text-sm text-purple-600 mt-2">Empty fields will be automatically set to "NA"</p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <p>{error}</p>
                </div>
            )}

            {/* Progress bar */}
            {uploading && (
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-purple-800">Uploading...</span>
                        <span className="text-sm font-medium text-black">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-purple-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Buttons - Upload only shows when file is selected */}
            <div className="flex items-center space-x-4">
                {file && !uploading && (
                    <button
                        onClick={handleUpload}
                        className="px-6 py-2 rounded-md font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                        Upload CSV
                    </button>
                )}

                <button
                    onClick={resetForm}
                    className="px-6 py-2 rounded-md font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                >
                    Reset
                </button>
                <div>
                    <a
                        className='bg-purple-400 py-2 px-4 rounded text-white hover:bg-purple-500 ease-in duration-75'
                        href="./pattern.csv">Download Patterns</a>
                </div>
            </div>

            {uploadResult && (
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-semibold text-purple-800 mb-4">Upload Results</h3>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-purple-100 p-4 rounded-lg">
                            <p className="text-sm text-purple-800 font-medium">Saved</p>
                            <p className="text-2xl font-bold text-black">{uploadResult.data.saved}</p>
                        </div>
                        <div className="bg-purple-100 p-4 rounded-lg">
                            <p className="text-sm text-purple-800 font-medium">Failed</p>
                            <p className="text-2xl font-bold text-black">{uploadResult.data.failed}</p>
                        </div>
                        <div className="bg-purple-100 p-4 rounded-lg">
                            <p className="text-sm text-purple-800 font-medium">Duplicates</p>
                            <p className="text-2xl font-bold text-black">{uploadResult.data.duplicates}</p>
                        </div>
                    </div>

                    {uploadResult.data.invalidPatterns.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-lg font-medium text-black mb-2">Invalid Patterns ({uploadResult.data.invalidPatterns.length})</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border">
                                    <thead className="bg-purple-50">
                                        <tr>
                                            <th className="py-2 px-4 border text-left text-purple-800">Style Number</th>
                                            <th className="py-2 px-4 border text-left text-purple-800">Pattern</th>
                                            <th className="py-2 px-4 border text-left text-purple-800">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadResult.data.invalidPatterns.map((pattern, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-2 px-4 border text-black">{pattern.style_number || 'Missing'}</td>
                                                <td className="py-2 px-4 border text-black">{pattern.pattern || 'Missing'}</td>
                                                <td className="py-2 px-4 border text-black">Missing required fields</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {uploadResult.data.duplicatePatterns.length > 0 && (
                        <div>
                            <h4 className="text-lg font-medium text-black mb-2">Duplicate Patterns ({uploadResult.data.duplicatePatterns.length})</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border">
                                    <thead className="bg-purple-50">
                                        <tr>
                                            <th className="py-2 px-4 border text-left text-purple-800">Style Number</th>
                                            <th className="py-2 px-4 border text-left text-purple-800">Pattern</th>
                                            <th className="py-2 px-4 border text-left text-purple-800">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadResult.data.duplicatePatterns.map((pattern, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-2 px-4 border text-black">{pattern.style_number}</td>
                                                <td className="py-2 px-4 border text-black">{pattern.pattern}</td>
                                                <td className="py-2 px-4 border text-black">Duplicate style number</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatternUpload;