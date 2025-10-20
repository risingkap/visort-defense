import React, { useState, useEffect } from 'react';
import appIcon from './images/viSORT_logo.png';

const LogoHeader = () => {
  const [displayedName, setDisplayedName] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    // Get first name from localStorage
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const user = JSON.parse(raw);
        if (user && typeof user.firstName === 'string') {
          setFirstName(user.firstName);
        }
      }
    } catch (_) {}

    // Start typing animation
    if (firstName) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= firstName.length) {
          setDisplayedName(firstName.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 100); // Adjust speed as needed

      return () => clearInterval(typingInterval);
    }
  }, [firstName]);

  return (
    <header className="sticky top-0 z-20 bg-gray-100 shadow-sm">
      <div className="flex justify-end items-center h-[90px] px-6">
        <span className="font-poppins font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mr-3 text-3xl">
          Welcome back, {displayedName}
          {firstName && displayedName.length < firstName.length && (
            <span className="animate-pulse">|</span>
          )}
          !
        </span>
        <img
          src={appIcon}
          alt="viSORT Logo"
          className="h-20 object-contain"
        />
      </div>
    </header>
  );
};

export default LogoHeader;