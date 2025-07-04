import React from 'react';
import './CircularGauge.css';

interface CircularGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  title: string;
  type: 'speed' | 'altitude' | 'vsi' | 'compass';
  size?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min,
  max,
  unit,
  title,
  type,
  size = 120
}) => {
  // Calculate the angle for the needle (270 degrees sweep, starting from -135deg)
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = (normalizedValue - min) / (max - min);
  const angle = -135 + (percentage * 270); // -135deg to +135deg

  // Generate tick marks based on gauge type
  const generateTicks = () => {
    const ticks = [];
    let tickCount = 0;
    let stepSize = 0;
    
    switch (type) {
      case 'speed':
        tickCount = 6; // 0, 10, 20, 30, 40, 50
        stepSize = (max - min) / (tickCount - 1);
        break;
      case 'altitude':
        tickCount = 6; // 0, 40, 80, 120, 160, 200
        stepSize = (max - min) / (tickCount - 1);
        break;
      case 'vsi':
        tickCount = 7; // -10, -5, 0, 5, 10, 15, 20
        stepSize = (max - min) / (tickCount - 1);
        break;
      case 'compass':
        tickCount = 12; // Every 30 degrees
        stepSize = 30;
        break;
      default:
        tickCount = 6;
        stepSize = (max - min) / (tickCount - 1);
    }

    for (let i = 0; i < tickCount; i++) {
      let tickValue;
      let tickAngle;
      
      if (type === 'compass') {
        tickValue = (i * stepSize) % 360;
        tickAngle = -135 + (i * (270 / (tickCount - 1)));
      } else {
        tickValue = min + (i * stepSize);
        tickAngle = -135 + (i * (270 / (tickCount - 1)));
      }
      
      ticks.push(
        <g key={i}>
          {/* Major tick line */}
          <line
            x1={35}
            y1={0}
            x2={42}
            y2={0}
            stroke="#ffaa00"
            strokeWidth="1.5"
            transform={`rotate(${tickAngle})`}
            transform-origin="0 0"
          />
          {/* Tick label */}
          <text
            x={28}
            y={2}
            fill="#ffaa00"
            fontSize="8"
            textAnchor="middle"
            transform={`rotate(${tickAngle}) rotate(${-tickAngle} 28 2)`}
            transform-origin="28 2"
          >
            {type === 'compass' ? (tickValue === 0 ? 'N' : tickValue === 90 ? 'E' : tickValue === 180 ? 'S' : tickValue === 270 ? 'W' : tickValue) : Math.round(tickValue)}
          </text>
        </g>
      );
    }
    return ticks;
  };

  return (
    <div className={`circular-gauge ${type}-gauge`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="rgba(0, 0, 0, 0.8)"
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Tick marks and labels */}
        <g transform="translate(50, 50)">
          {generateTicks()}
        </g>
        
        {/* Needle */}
        <g transform={`translate(50, 50) rotate(${angle})`}>
          <line
            x1="0"
            y1="0"
            x2="32"
            y2="0"
            stroke="#ff4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        {/* Center dot - after needle so it's on top */}
          <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="#ffaa00"
          stroke="#333"
          strokeWidth="0.5"
          />
      </svg>
      
      {/* Digital display */}
      <div className="gauge-display">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">
          {type === 'compass' ? `${Math.round(value)}°` : `${value.toFixed(1)}`}
        </div>
        {type !== 'compass' && <div className="gauge-unit">{unit}</div>}
      </div>
    </div>
  );
};

export default CircularGauge; 