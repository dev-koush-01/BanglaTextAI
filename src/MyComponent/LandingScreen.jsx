import React, { useEffect, useRef } from 'react';

const LandingScreen = ({ onStart }) => {
  const canvasRef = useRef(null);
  const wavesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

    class Wave {
      constructor() {
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.speed = 2;
        this.color = 'rgba(255, 161, 98, 0.7)';
        this.lineWidth = 1 + Math.random() * 2;
        this.alpha = 0.8;
        this.minAlpha = 0.1;
      }

      update() {
        this.radius += this.speed;
        if (this.alpha > this.minAlpha) {
          this.alpha -= 0.005;
        }
        return this.radius <= this.maxRadius;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 161, 98, ${this.alpha.toFixed(2)})`;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
      }
    }

    const addWave = () => {
      wavesRef.current.push(new Wave());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const keep = wavesRef.current[i].update();
        if (keep) {
          wavesRef.current[i].draw();
        } else {
          wavesRef.current.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    };

    const intervalId = setInterval(addWave, 1000);
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      <h1 style={styles.title} className="fade-in-title">
        Welcome to BanglaTextAI
      </h1>
      <p style={styles.subtitle} className="fade-in-subtitle">
        Breaking language barriers with AI-powered solutions
      </p>
      <button style={styles.button} onClick={onStart} className="pulse-button">
        Get Started
      </button>

      <style>{`
        .fade-in-title {
          animation: fadeIn 2s ease-in-out forwards;
          opacity: 0;
        }

        .fade-in-subtitle {
          animation: fadeIn 2.5s ease-in-out forwards;
          opacity: 0;
        }

        .pulse-button {
          animation: pulse 2s infinite;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(255, 204, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    textAlign: 'center',
    padding: '100px 20px',
    background: 'linear-gradient(120deg, #1a1a1a, #333, #1a1a1a)', // Animated gradient
    backgroundSize: '200% 200%',
    animation: 'gradientShift 10s ease infinite',
    color: '#fff',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  title: {
    fontSize: '3.5rem',
    marginBottom: '20px',
    color: '#ffcc00',
    zIndex: 2,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: '40px',
    color: '#ffcc99',
    zIndex: 2,
  },
  button: {
    padding: '14px 30px',
    fontSize: '1.2rem',
    background: 'linear-gradient(90deg, #ffcc00, #ffa162)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#000',
    zIndex: 2,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  buttonHover: {
    transform: 'scale(1.1)',
    boxShadow: '0 4px 15px rgba(255, 204, 0, 0.5)',
  },
};

export default LandingScreen;