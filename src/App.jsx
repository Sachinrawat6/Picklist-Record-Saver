import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PicklistScanner from './pages/PicklistScanner';
import SkuScanner from './pages/SkuScanner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Orders from './pages/Orders';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
       <Navbar/>
        <main className="w-full mx-auto">
          <Routes>
            <Route path="/picklist" element={<PicklistScanner />} />
            <Route path="/sku" element={<SkuScanner />} />
            <Route path="/" element={<Home/>} />
            <Route path="/orders" element={<Orders/>} />

          </Routes>
        </main>

      </div>
    </Router>
  );
};

export default App;