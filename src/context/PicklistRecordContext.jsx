import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create context
const PicklistRecordContext = createContext();

// Provider component
const PicklistRecordContextProvider = ({ children }) => {
  const [syncLogData, setSyncLogData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const fetchSyncLogData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://app.nocodb.com/api/v2/tables/mx9t4jvkws2b268/records",
        {
          params: {
            offset: "0",
            limit: "1000",
            where: "",
            viewId: "vwn7z8ie5xhlfei7",
          },
          headers: {
            "xc-token": "-0XAccEvsn8koGW5MKQ79LoPj07lxk_1ldqDmuv1",
          },
        }
      );
      setSyncLogData(response.data?.list || []);
    } catch (err) {
      console.error("Failed to fetch sync log data", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const API_URL = "https://inventorybackend-m1z8.onrender.com/api/v1/cutting-list/get-patterns";
    const fetchPatterns = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        setPatterns(response.data.data || []);

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch patterns');
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  useEffect(() => {
    fetchSyncLogData();
  }, []);



  return (
    <PicklistRecordContext.Provider
      value={{ loading, syncLogData, error, fetchSyncLogData, patterns }}
    >
      {children}
    </PicklistRecordContext.Provider>
  );
};

// Custom hook for using the context
const useGlobalContext = () => {
  return useContext(PicklistRecordContext);
};

export { useGlobalContext, PicklistRecordContextProvider };
