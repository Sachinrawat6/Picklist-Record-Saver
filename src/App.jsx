import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PicklistScanner from './pages/PicklistScanner';
import SkuScanner from './pages/SkuScanner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Orders from './pages/Orders';
import SyncLog from "./pages/SyncLog";
import {PicklistRecordContextProvider} from "./context/PicklistRecordContext"
import SyncIdRecords from './components/SyncIdRecords';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
       <Navbar/>
        <main className="w-full mx-auto">
          <PicklistRecordContextProvider>
          <Routes>
            <Route path="/picklist" element={<PicklistScanner />} />
            <Route path="/sku" element={<SkuScanner />} />
            <Route path="/" element={<Home/>} />
            <Route path="/orders" element={<Orders/>} />
            <Route path="/sync-log" element={<SyncLog/>} />
            <Route path="/sync-records/:sync_id/:picklist_id" element={<SyncIdRecords/>} />

          </Routes>
          </PicklistRecordContextProvider>
        </main>

      </div>
    </Router>
  );
};

export default App;