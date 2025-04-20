import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LandingScreen from './MyComponent/LandingScreen.jsx';
import HeroSection from './MyComponent/HeroSection.jsx';
import Navbar from './MyComponent/Navbar.jsx';
import TranslateScreen from './MyComponent/TranslateScreen.jsx';

const App = () => {
  const [started, setStarted] = useState(false);

  return (
    <Router>
      <div>
        <Navbar />

        <Routes>
          
          <Route
            path="/"
            element={
              !started ? (
                <LandingScreen onStart={() => setStarted(true)} />
              ) : (
                <HeroSection />
              )
            }
          />

          
          <Route path="/translate" element={<TranslateScreen />} />

          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
