import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logoVisible, setLogoVisible] = useState(false);
  const [loadingBarVisible, setLoadingBarVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 1. Logo fade in animasyonu (200ms'de başla)
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 200);

    // 2. Loading bar'ı hemen logo ile birlikte göster (800ms sonra)
    const loadingBarTimer = setTimeout(() => {
      setLoadingBarVisible(true);
    }, 800);

    // 3. Loading progress (1 saniye sonra başla)
    const progressTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 6 + 3; // Daha kontrollü progress
          
          if (newProgress >= 100) {
            clearInterval(interval);
            
            // Loading tamamlandığında biraz bekle, sonra fade out başlat
            setTimeout(() => {
              setFadeOut(true);
              
              // Fade out animasyonu tamamen bitene kadar bekle
              setTimeout(() => {
                onLoadComplete();
              }, 800); // CSS'teki transition süresi + buffer
            }, 400);
            
            return 100;
          }
          
          return newProgress;
        });
      }, 100); // Daha sık güncelleme
    }, 1000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(loadingBarTimer);
      clearTimeout(progressTimer);
    };
  }, [onLoadComplete]);

  return (
    <div className={`minimal-loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Grid Pattern Background */}
      <div className="grid-background"></div>
      
      {/* Logo */}
      <div className={`logo-container ${logoVisible ? 'visible' : ''}`}>
        <img 
          src="/skypulse logow.png" 
          alt="SkyPulse" 
          className="main-logo"
        />
      </div>
      
      {/* Loading Bar */}
      <div className={`loading-bar-container ${loadingBarVisible ? 'visible' : ''}`}>
        <div className="loading-bar">
          <div 
            className="loading-bar-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 