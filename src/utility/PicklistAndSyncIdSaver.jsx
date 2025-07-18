import axios from "axios";

const ACCESS_TOKEN = "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1";
const BASE_URL = "https://app.nocodb.com/api/v2/tables/mx9t4jvkws2b268/records";

const PicklistAndSyncIdSaver = async (data) => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
        alert("No picklist and sync ID to save.");
        return;
    }

    try {
        const response = await axios.post(
            BASE_URL,
            // { records: Array.isArray(data) ? data : [data] },
            data,
            
            {
                headers: {
                    "xc-token": ACCESS_TOKEN,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Success:", response);
        return response.data;
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        console.error("API Error:", {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        });
        alert(`Failed to save data: ${errorMessage}`);
        throw err;
    }
};

export default PicklistAndSyncIdSaver;
