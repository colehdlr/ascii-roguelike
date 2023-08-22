import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, infinite }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const delay = 60; // Set the delay to 80ms

  useEffect(() => {
    let animationFrameId;
    let prevTime = Date.now();

    const animateTypewriter = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - prevTime;

      if (deltaTime >= delay) {
        prevTime = currentTime;
        if (currentIndex < text.length) {
          setCurrentText(prevText => prevText + text[currentIndex]);
          setCurrentIndex(prevIndex => prevIndex + 1);
        } else if (infinite) {
          setCurrentIndex(0);
          setCurrentText('');
        }
      }

      animationFrameId = requestAnimationFrame(animateTypewriter);
    };

    animationFrameId = requestAnimationFrame(animateTypewriter);

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentIndex, infinite, text]);

  return <span>{currentText}</span>;
};

export default Typewriter;
