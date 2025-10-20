import React from 'react';
import appIcon from '../LogoHeader/images/viSORT_logo.png';
import './LoadingScreen.css';

const LoadingScreen = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container">
          <img
            src={appIcon}
            alt="ViSORT Logo"
            className="spinning-logo"
          />
        </div>
        <div className="loading-text">
          <h2 className="loading-title">ViSORT</h2>
          <p className="loading-subtitle">Automating Medical Waste Management</p>
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

