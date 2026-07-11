import React, { useState, useEffect } from 'react';

const CountUpValue = ({ value }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const isCurrency = typeof value === 'string' && value.startsWith('$');
    const numericStr = typeof value === 'string' 
      ? value.replace(/[^0-9.]/g, '') 
      : String(value);
    
    const targetNumber = parseFloat(numericStr);
    
    if (isNaN(targetNumber)) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1000; // 1 second animation time
    const frameRate = 1000 / 60; // 60 frames per second
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const formatVal = (val) => {
      if (isCurrency) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(val);
      }
      return Math.round(val).toLocaleString();
    };

    const timer = setInterval(() => {
      frame++;
      // Cubic ease-out interpolation
      const progress = 1 - Math.pow(1 - (frame / totalFrames), 3);
      const current = targetNumber * progress;
      
      setDisplayValue(formatVal(current));

      if (frame >= totalFrames) {
        clearInterval(timer);
        setDisplayValue(value); // Set exact target at the end
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

const MetricCard = ({ title, value, color = 'purple', icon: Icon }) => {
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className="metric-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="metric-value">
        <CountUpValue value={value} />
      </div>
    </div>
  );
};

export default MetricCard;
