import React from "react";

const Navbar = () => {
  const styles = {
    nav: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '97%',
      padding: '20px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000,
      color: '#fff',
      fontFamily: 'monospace',
    },
    logo: {
      fontWeight: 'bold',
      fontSize: '1.4rem',
      letterSpacing: '1px',
      textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
    },
    links: {
      display: 'flex',
      gap: '30px',
    },
    link: {
      cursor: 'pointer',
      padding: '6px 12px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    },
  };

  return (
    <>
      <style>{`
        /* Hide scrollbar */
        body {
          overflow: hidden;
        }
      `}</style>
      <nav style={styles.nav}>
        <div style={styles.logo}>BanglaTextAI</div>
        <div style={styles.links}>
          <span style={styles.link}>INSIGHT</span>
          <span style={styles.link}>TRANSLATE</span>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
