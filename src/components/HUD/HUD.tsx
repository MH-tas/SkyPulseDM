import React from 'react';
import './HUD.css';

interface HUDProps {
  connected: boolean;
  telemetry: {
    altitude: number;
    speed: number;
    battery: number;
    gpsLat: number;
    gpsLon: number;
    heading: number;
    mode: string;
    armed: boolean;
    satellites: number;
    pitch: number;
    roll: number;
  };
}

const HUD: React.FC<HUDProps> = ({ connected, telemetry }) => {
  // Use real telemetry data for pitch and roll
  const pitch = telemetry.pitch || 0;
  const roll = telemetry.roll || 0;

  return (
    <div className="hud-container">
      {/* Top Flight Data */}
      <div className="flight-data-top">
        <div className="flight-data-item">
          <span className="data-label">YAW</span>
          <span className="data-value">{Math.round(telemetry.heading)}°</span>
        </div>
        <div className="flight-data-item">
          <span className="data-label">PITCH</span>
          <span className="data-value">{pitch.toFixed(1)}°</span>
        </div>
        <div className="flight-data-item">
          <span className="data-label">ROLL</span>
          <span className="data-value">{roll.toFixed(1)}°</span>
        </div>
        <div className="flight-data-item">
          <span className="data-label">MODE</span>
          <span className="data-value">{telemetry.mode}</span>
        </div>
      </div>

      {/* Middle Row - Main Display */}
      <div className="hud-middle-row">
        {/* Speed Tape */}
        <div className="speed-tape">
          <div className="tape-header">SPD</div>
          <div className="tape-value">{telemetry.speed.toFixed(1)}</div>
          <div className="tape-unit">m/s</div>
        </div>

        {/* Artificial Horizon */}
        <div className="horizon-container">
          {/* Artificial Horizon */}
          <div className="artificial-horizon">
            <div 
              className="horizon-sky"
              style={{
                transform: `rotate(${roll}deg) translateY(${pitch * 2}px)`
              }}
            >
              <div className="horizon-line"></div>
              <div className="horizon-ground"></div>
              
              {/* Pitch ladder */}
              <div className="pitch-ladder">
                {[-20, -10, 0, 10, 20].map(angle => (
                  <div
                    key={angle}
                    className={`pitch-line ${angle === 0 ? 'center' : ''}`}
                    style={{ top: `calc(50% + ${(angle - pitch) * 3}px)` }}
                  >
                    <span className="pitch-value">{angle}</span>
                    <div className="pitch-mark"></div>
                    <span className="pitch-value">{angle}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Aircraft symbol */}
            <div className="aircraft-symbol">
              <div className="aircraft-center-dot"></div>
              <div className="aircraft-wings"></div>
            </div>
            
            {/* Status text */}
            <div className="status-overlay">
              <div className={`arm-status ${telemetry.armed ? 'armed' : 'disarmed'}`}>
                {telemetry.armed ? 'ARMED' : 'DISARMED'}
              </div>
              <div className="flight-mode">{telemetry.mode}</div>
            </div>
          </div>
        </div>

        {/* Altitude Tape */}
        <div className="altitude-tape">
          <div className="tape-header">ALT</div>
          <div className="tape-value">{telemetry.altitude.toFixed(0)}</div>
          <div className="tape-unit">m</div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="hud-bottom-row">
        {/* Speed Section */}
        <div className="status-section">
          <div className="section-title">SPEED</div>
          <div className="status-items">
            <div className="status-item">
              <span className="status-label">AS</span>
              <span className="status-value">{telemetry.speed.toFixed(1)} m/s</span>
            </div>
            <div className="status-item">
              <span className="status-label">GS</span>
              <span className="status-value">{telemetry.speed.toFixed(1)} m/s</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="status-section">
          <div className="section-title">NAVIGATION</div>
          <div className="status-items">
            <div className="status-item">
              <span className="status-label">SATS</span>
              <span className="status-value">{telemetry.satellites}</span>
            </div>
            <div className={`status-indicator ${telemetry.satellites > 0 ? 'ok' : 'error'}`}>
              {telemetry.satellites > 0 ? 'GPS OK' : 'NO GPS'}
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="status-section">
          <div className="section-title">SYSTEM</div>
          <div className="status-items">
            <div className={`status-indicator ${!telemetry.armed ? 'error' : 'ok'}`}>
              {!telemetry.armed ? 'NOT READY' : 'READY'}
            </div>
            <div className={`status-indicator ${connected ? 'ok' : 'error'}`}>
              {connected ? 'EKF OK' : 'NO EKF'}
            </div>
            <div className={`status-indicator ${connected ? 'ok' : 'warning'}`}>
              VIBE OK
            </div>
          </div>
        </div>

        {/* Power Section */}
        <div className="status-section">
          <div className="section-title">POWER</div>
          <div className="status-items">
            <div className="power-item">
              <span className="power-label">VOLT</span>
              <span className="voltage">{(telemetry.battery * 0.168).toFixed(1)}V</span>
            </div>
            <div className="power-item">
              <span className="power-label">AMP</span>
              <span className="current">0.0A</span>
            </div>
            <div className="power-item">
              <span className="power-label">BAT</span>
              <span className="power">{telemetry.battery}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD; 