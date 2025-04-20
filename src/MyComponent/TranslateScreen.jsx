import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const TranslateScreen = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const [emotionData, setEmotionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [translateDirection, setTranslateDirection] = useState('en2bn'); // Add this state

  // Typing animation for translated text
  useEffect(() => {
    if (!translatedText) return;
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < translatedText.length) {
        setDisplayedText(translatedText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [translatedText]);

  // Cleanup function to properly release camera on unmount
  useEffect(() => {
    // Store ref in a variable that's captured by the cleanup function
    const videoElement = videoRef.current;

    return () => {
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array since we only want this to run on mount/unmount

  // Camera activation
  const toggleCamera = useCallback(async () => {
    try {
      if (!cameraOn) {
        // Try localhost first, then IP address
        const urls = [
          'http://localhost:5001/video_feed',
          'http://192.168.167.184:5001/video_feed'
        ];
        
        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              if (videoRef.current) {
                videoRef.current.src = url;
                setCameraOn(true);
                return;
              }
            }
          } catch (err) {
            console.warn(`Failed to connect to ${url}:`, err);
          }
        }
        throw new Error('Could not connect to any video feed URL');
      } else {
        if (videoRef.current) {
          videoRef.current.src = '';
          setCameraOn(false);
        }
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraOn(false);
      alert('Please ensure:\n1. Flask server is running\n2. Camera is not in use\n3. Check browser console for details');
    }
  }, [cameraOn]);

  // Update the fetchEmotionData function
  const fetchEmotionData = useCallback(async () => {
    if (cameraOn) {
      try {
        const response = await fetch('http://localhost:5001/detection_results');
        if (response.ok) {
          const data = await response.json();
          setEmotionData(data.detections);
        }
      } catch (error) {
        console.error('Error fetching emotion data:', error);
      }
    }
  }, [cameraOn]);

  // Update useEffect to start emotion detection when camera is on
  useEffect(() => {
    if (cameraOn) {
      fetchEmotionData();
    }
  }, [cameraOn, fetchEmotionData]);

  useEffect(() => {
    let intervalId;
    if (cameraOn) {
      // Poll for emotion data every second
      intervalId = setInterval(fetchEmotionData, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cameraOn, fetchEmotionData]);

  // Add this function inside your TranslateScreen component
  const translateText = async (text) => {
    if (!text?.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          direction: translateDirection
        })
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.translated) {
        // Set the translated text directly without any manipulation
        setTranslatedText(data.translated);
        // Clear input field after successful translation
        setInputText('');
        // Reset displayed text to empty to trigger animation
        setDisplayedText('');
      } else {
        throw new Error(data.message || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Translation Direction Toggle */}
      <div style={styles.toggleContainer}>
        <button 
          style={{
            ...styles.toggleBtn,
            backgroundColor: translateDirection === 'en2bn' ? '#ffcc00' : 'transparent'
          }}
          onClick={() => setTranslateDirection('en2bn')}
        >
          English → Bengali
        </button>
        <button 
          style={{
            ...styles.toggleBtn,
            backgroundColor: translateDirection === 'bn2en' ? '#ffcc00' : 'transparent'
          }}
          onClick={() => setTranslateDirection('bn2en')}
        >
          Bengali → English
        </button>
      </div>

      {/* Text Input */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={styles.inputContainer}
      >
        <input
          type="text"
          placeholder={translateDirection === 'en2bn' ? "Enter English text" : "বাংলা টেক্সট লিখুন"}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.submitBtn}
          onClick={() => translateText(inputText)}
          disabled={isLoading}
        >
          {isLoading ? '⌛' : '➡️'}
        </button>
      </motion.div>

      {/* Translated Text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={styles.translatedContainer}
      >
        <p style={styles.translated}>
          {displayedText}
        </p>
      </motion.div>

      {/* Camera Panel */}
      <motion.div style={styles.cameraCard}>
        <p style={styles.cameraText}>📷 Camera</p>
        <p style={styles.cameraNote}>Access for face recognition</p>
        <button onClick={toggleCamera} style={styles.cameraBtn}>
          {cameraOn ? 'Stop Camera' : 'Start Camera'}
        </button>
        {emotionData && emotionData.length > 0 && (
          <div style={styles.emotionContainer}>
            {emotionData.map((detection, index) => (
              <p key={index} style={styles.emotionText}>
                Emotion: {detection.emotion}
              </p>
            ))}
          </div>
        )}
        <img 
          ref={videoRef}
          alt="Video feed"
          style={{
            ...styles.video,
            display: cameraOn ? 'block' : 'none', // Apply the conditional logic here
          }}
          onError={(e) => {
            console.error('Video feed error:', e);
            setCameraOn(false);
            alert('Error loading video feed. Please check server connection.');
          }}
        />
      </motion.div>
    </div>
  );
};

// Enhanced CSS
const styles = {
  container: {
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8)), url('/image.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#fff',
    height: '100vh',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to the top
    fontFamily: 'Courier New, monospace',
    overflowY: 'auto', // Enable vertical scrolling
  },
  toggleContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    width: '90%',
    maxWidth: '500px',
    justifyContent: 'center',
  },
  toggleBtn: {
    padding: '10px 20px',
    border: '2px solid #ffcc00',
    borderRadius: '20px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #fff',
    borderRadius: '50px',
    padding: '10px 20px',
    marginBottom: '30px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    flex: 1,
    fontSize: '16px',
    padding: '5px',
  },
  submitBtn: {
    background: 'linear-gradient(90deg, #ffcc00, #ffa162)',
    border: 'none',
    color: '#000',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '10px 20px',
    borderRadius: '20px',
    fontWeight: 'bold',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  translatedContainer: {
    width: '90%',
    maxWidth: '600px',
    minHeight: '60px',
    margin: '20px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translated: {
    fontSize: '20px',
    color: '#ffcc99',
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '15px 20px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    wordWrap: 'break-word',
    direction: 'ltr', // Ensures proper text direction
    minHeight: '30px',
  },
  cameraCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: '20px',
    padding: '20px',
    marginTop: '40px',
    textAlign: 'center',
    width: '640px', // Match the video width
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    margin: '0 auto', // Center alignment
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center content horizontally
  },
  cameraText: {
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '10px',
  },
  cameraNote: {
    fontSize: '14px',
    color: '#ddd',
    marginBottom: '20px',
  },
  cameraBtn: {
    backgroundColor: '#ffcc00',
    color: '#000',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  video: {
    width: '640px',
    height: '480px',
    borderRadius: '10px',
    marginTop: '10px', // Reduced margin to move the camera feed upward
    objectFit: 'cover',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  emotionContainer: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
  },
  emotionText: {
    color: '#ffcc00',
    margin: '5px 0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  error: {
    color: '#ff4444',
    fontSize: '14px',
    marginTop: '10px',
    textAlign: 'center'
  },
  loading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
};

export default TranslateScreen;
