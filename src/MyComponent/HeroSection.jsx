import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation when the component mounts
    setFadeIn(true);
  }, []);

  const styles = {
    heroContainer: {
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'black',
      fontFamily: 'Courier New, monospace',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: fadeIn ? 0.5 : 0, // Start with 0 opacity and fade in
      transition: 'opacity 2s ease-in-out', // Smooth fade-in transition
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      color: 'white',
      textAlign: 'center',
    },
    fadeInText: {
      animation: 'fadeIn 2s ease-in-out',
      margin: '1rem 0',
    },
    buttonGroup: {
      marginTop: '2rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
    },
    button: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '1rem',
      fontFamily: 'Courier New, monospace',
    },
    whiteButton: {
      backgroundColor: 'white',
      color: 'black',
    },
    transparentButton: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '2px solid white',
    },
    keyframes: `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  };

  return (
    <div style={styles.heroContainer}>
      <style>{styles.keyframes}</style>
      <img
        src="/image.png" // Image from the public folder
        alt="background"
        style={styles.backgroundImage}
      />
      <div style={styles.content}>
        <h1 style={styles.fadeInText}>
          BREAK LANGUAGE BARRIER. DECODE EMOTIONS INSTANTLY
        </h1>
        <p style={styles.fadeInText}>
          Empowering Communication in Bangla with AI Precision
        </p>
        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.whiteButton }}
            onClick={() => navigate('/insight')}
          >
            LEARN MORE
          </button>
          <button
            style={{ ...styles.button, ...styles.transparentButton }}
            onClick={() => navigate('/translate')}
          >
            TRANSLATE
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
