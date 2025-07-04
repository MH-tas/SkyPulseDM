import React from 'react';
import './Header.css';

interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
  friendlyName?: string;
  deviceType?: string;
  isKnownTelemetry?: boolean;
}

interface HeaderProps {
  activeTab: 'main' | 'autonomous' | 'livedata' | 'motor' | 'options';
  setActiveTab: (tab: 'main' | 'autonomous' | 'livedata' | 'motor' | 'options') => void;
  availablePorts: SerialPortInfo[];
  selectedPort: string;
  selectedBaudrate: number;
  setSelectedPort: (port: string) => void;
  onBaudrateChange: (baudrate: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  connected: boolean;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  availablePorts,
  selectedPort,
  selectedBaudrate,
  setSelectedPort,
  onBaudrateChange,
  onConnect,
  onDisconnect,
  connecting,
  connected
}) => {
  const currentTime = new Date().toLocaleTimeString('tr-TR', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Common baudrates from 1200 to 1.5M
  const baudrates = [
    1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 
    57600, 76800, 115200, 153600, 230400, 307200, 460800, 
    614400, 921600, 1000000, 1500000
  ];

  return (
    <>
      <header className="military-header">
        <div className="header-left">
          <div className="app-title">
            <img 
              src="/skypulsewhite4.png" 
              alt="SkyPulse" 
              className="logo-image"
            />
          </div>
        </div>
        
        <div className="header-center">
          <div className="mission-status">
            <span className="status-label">CONNECTION STATUS</span>
            <span className={`status-value ${connected ? 'active' : 'standby'}`}>
              {connected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="system-info">
            <div className="time-display">
              <span className="time-label">ZULU TIME</span>
              <span className="time-value">{currentTime}</span>
            </div>
            
            <div className="connection-indicator">
              <div className={`signal-strength ${connected ? 'strong' : 'weak'}`}>
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
              </div>
              <span className="connection-text">
                {connected ? 'LINK ESTABLISHED' : 'NO SIGNAL'}
              </span>
              
              <div className="header-connection-controls">
                <select 
                  value={selectedPort} 
                  onChange={(e) => setSelectedPort(e.target.value)}
                  disabled={connected}
                  className="header-port-select"
                >
                  <option value="">Select Port</option>
                  {availablePorts.map(port => (
                    <option key={port.path} value={port.path}>
                      {port.friendlyName || port.path}
                    </option>
                  ))}
                </select>

                <select 
                  value={selectedBaudrate} 
                  onChange={(e) => onBaudrateChange(Number(e.target.value))}
                  disabled={connected}
                  className="header-baudrate-select"
                >
                  {baudrates.map(baudrate => (
                    <option key={baudrate} value={baudrate}>
                      {baudrate >= 1000000 ? `${(baudrate / 1000000).toFixed(1)}M` : `${baudrate}`}
                    </option>
                  ))}
                </select>
                
                {!connected ? (
                  <button 
                    onClick={onConnect} 
                    disabled={connecting || !selectedPort}
                    className="header-connect-btn"
                  >
                    {connecting ? '...' : 'CONN'}
                  </button>
                ) : (
                  <button 
                    onClick={onDisconnect} 
                    className="header-disconnect-btn"
                  >
                    DISC
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          MAIN
        </button>
        <button 
          className={`tab-btn ${activeTab === 'autonomous' ? 'active' : ''}`}
          onClick={() => setActiveTab('autonomous')}
        >
          AUTONOMOUS
        </button>
        <button 
          className={`tab-btn ${activeTab === 'livedata' ? 'active' : ''}`}
          onClick={() => setActiveTab('livedata')}
        >
          LIVE DATA
        </button>
        <button 
          className={`tab-btn ${activeTab === 'motor' ? 'active' : ''}`}
          onClick={() => setActiveTab('motor')}
        >
          MOTOR TEST
        </button>
        <button 
          className={`tab-btn ${activeTab === 'options' ? 'active' : ''}`}
          onClick={() => setActiveTab('options')}
        >
          OPTIONS
        </button>
      </div>
    </>
  );
};

export default Header; 