import React, { useState } from 'react';
import './Options.css';

type OptionCategory = 
  | 'general' 
  | 'connection' 
  | 'display' 
  | 'map' 
  | 'camera' 
  | 'flight' 
  | 'telemetry'
  | 'advanced' 
  | 'about';

interface TelemetrySettings {
  local: {
    baudRate: number;
    airSpeed: number;
    networkId: number;
    txPower: number;
    ecc: boolean;
    mavlink: number;
    opResend: boolean;
  };
  remote: {
    airSpeed: number;
    networkId: number;
    txPower: number;
    ecc: boolean;
    mavlink: number;
    opResend: boolean;
  };
  dataStream: {
    heartbeatRate: number;
    extendedStatusRate: number;
    positionRate: number;
    rcChannelsRate: number;
    rawSensorRate: number;
  };
}

const Options: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<OptionCategory>('general');
  const [telemetrySettings, setTelemetrySettings] = useState<TelemetrySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const loadTelemetrySettings = async () => {
    setLoadingSettings(true);
    
    try {
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const settings = await ipcRenderer.invoke('get-telemetry-settings');
        
        if (settings.success) {
          setTelemetrySettings(settings.data);
        } else {
          alert(`Settings load failed: ${settings.message}`);
        }
      } else {
        // Web tarayıcısında demo data
        setTelemetrySettings({
          local: {
            baudRate: 57600,
            airSpeed: 64,
            networkId: 25,
            txPower: 20,
            ecc: true,
            mavlink: 2,
            opResend: false
          },
          remote: {
            airSpeed: 64,
            networkId: 25,
            txPower: 20,
            ecc: true,
            mavlink: 2,
            opResend: false
          },
          dataStream: {
            heartbeatRate: 1,
            extendedStatusRate: 2,
            positionRate: 3,
            rcChannelsRate: 5,
            rawSensorRate: 0
          }
        });
      }
    } catch (error) {
      alert(`Settings load error: ${error}`);
    }
    
    setLoadingSettings(false);
  };

  const loadTelemetryFromFile = async () => {
    try {
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('load-telemetry-file');
        
        if (result.success) {
          setTelemetrySettings(result.data);
          alert(`Telemetry settings loaded successfully from file!`);
        } else {
          alert(`Load failed: ${result.message}`);
        }
      } else {
        alert('File operations not available in web browser');
      }
    } catch (error) {
      alert(`File load error: ${error}`);
    }
  };

  const saveTelemetryToFile = async () => {
    try {
      if (!telemetrySettings) {
        alert('No telemetry settings to save. Please load settings first.');
        return;
      }

      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('save-telemetry-file', telemetrySettings);
        
        if (result.success) {
          alert(`Telemetry settings saved successfully to file!`);
        } else {
          alert(`Save failed: ${result.message}`);
        }
      } else {
        alert('File operations not available in web browser');
      }
    } catch (error) {
      alert(`File save error: ${error}`);
    }
  };

  const copyToRemote = async () => {
    try {
      if (!telemetrySettings) {
        alert('No telemetry settings loaded. Please load settings first.');
        return;
      }

      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('copy-to-remote', telemetrySettings.local);
        
        if (result.success) {
          alert(`Local settings copied to remote radio successfully!`);
          // Reload settings to see the changes
          await loadTelemetrySettings();
        } else {
          alert(`Copy failed: ${result.message}`);
        }
      } else {
        alert('Remote operations not available in web browser');
      }
    } catch (error) {
      alert(`Copy to remote error: ${error}`);
    }
  };

  const resetTelemetryDefaults = async () => {
    const confirmReset = confirm('Are you sure you want to reset all telemetry settings to default values? This action cannot be undone.');
    
    if (!confirmReset) return;

    try {
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('reset-telemetry-defaults');
        
        if (result.success) {
          setTelemetrySettings(result.data);
          alert(`Telemetry settings reset to defaults successfully!`);
        } else {
          alert(`Reset failed: ${result.message}`);
        }
      } else {
        // Web tarayıcısında varsayılan ayarları göster
        setTelemetrySettings({
          local: {
            baudRate: 57600,
            airSpeed: 64,
            networkId: 25,
            txPower: 20,
            ecc: true,
            mavlink: 2,
            opResend: false
          },
          remote: {
            airSpeed: 64,
            networkId: 25,
            txPower: 20,
            ecc: true,
            mavlink: 2,
            opResend: false
          },
          dataStream: {
            heartbeatRate: 1,
            extendedStatusRate: 2,
            positionRate: 3,
            rcChannelsRate: 5,
            rawSensorRate: 0
          }
        });
        alert('Telemetry settings reset to defaults!');
      }
    } catch (error) {
      alert(`Reset error: ${error}`);
    }
  };

  const updateTelemetrySettings = (path: string, value: any) => {
    if (!telemetrySettings) return;
    
    const newSettings = { ...telemetrySettings };
    const pathParts = path.split('.');
    
    if (pathParts.length === 2) {
      const [section, field] = pathParts;
      if (section === 'local' || section === 'remote' || section === 'dataStream') {
        (newSettings as any)[section][field] = value;
      }
    }
    
    setTelemetrySettings(newSettings);
  };

  const saveTelemetrySettings = async () => {
    if (!telemetrySettings) {
      alert('No telemetry settings to save. Please load settings first.');
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.require) {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('save-telemetry-settings', telemetrySettings);
        
        if (result.success) {
          alert(`Telemetry settings saved successfully to radio!`);
        } else {
          alert(`Save failed: ${result.message}`);
        }
      } else {
        alert('Radio operations not available in web browser');
      }
    } catch (error) {
      alert(`Save error: ${error}`);
    }
  };
  
  const categories = [
    { id: 'general' as OptionCategory, label: 'General' },
    { id: 'connection' as OptionCategory, label: 'Connection' },
    { id: 'display' as OptionCategory, label: 'Display' },
    { id: 'map' as OptionCategory, label: 'Map' },
    { id: 'camera' as OptionCategory, label: 'Camera' },
    { id: 'flight' as OptionCategory, label: 'Flight' },
    { id: 'telemetry' as OptionCategory, label: 'Telemetry' },
    { id: 'advanced' as OptionCategory, label: 'Advanced' },
    { id: 'about' as OptionCategory, label: 'About' }
  ];

  const renderGeneralSettings = () => (
    <div className="options-settings-content">
      <h2>General Settings</h2>
      
      <div className="settings-group">
        <h3>Application</h3>
        <div className="setting-item">
          <label>Language</label>
          <select defaultValue="English">
            <option value="English">English</option>
            <option value="Turkish">Türkçe</option>
            <option value="Spanish">Español</option>
            <option value="French">Français</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Theme</label>
          <select defaultValue="Dark">
            <option value="Dark">Dark</option>
            <option value="Light">Light</option>
            <option value="Auto">Auto</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Auto Save Settings</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Log Level</label>
          <select defaultValue="Info">
            <option value="Debug">Debug</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderConnectionSettings = () => (
    <div className="options-settings-content">
      <h2>Connection Settings</h2>
      
      <div className="settings-group">
        <h3>Serial Connection</h3>
        <div className="setting-item">
          <label>Auto Connect on Startup</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Connection Timeout (seconds)</label>
          <input type="number" defaultValue={30} min="5" max="120" />
        </div>
        
        <div className="setting-item">
          <label>Heartbeat Frequency (Hz)</label>
          <input type="number" defaultValue={1} min={0.1} max={10} step={0.1} />
        </div>
        
        <div className="setting-item">
          <label>MAVLink Version</label>
          <select defaultValue="2.0">
            <option value="1.0">MAVLink 1.0</option>
            <option value="2.0">MAVLink 2.0</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="options-settings-content">
      <h2>Display Settings</h2>
      
      <div className="settings-group">
        <h3>HUD Elements</h3>
        <div className="setting-item">
          <label>Show Grid</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Show Compass</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Show Altitude Indicator</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>HUD Opacity (%)</label>
          <input type="range" defaultValue={80} min={20} max={100} />
          <span className="range-value">80%</span>
        </div>
      </div>
    </div>
  );

  const renderMapSettings = () => (
    <div className="options-settings-content">
      <h2>Map Settings</h2>
      
      <div className="settings-group">
        <h3>Map Display</h3>
        <div className="setting-item">
          <label>Map Provider</label>
          <select defaultValue="OpenStreetMap">
            <option value="OpenStreetMap">OpenStreetMap</option>
            <option value="Satellite">Satellite</option>
            <option value="Terrain">Terrain</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Show Satellites</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Show Flight Trail</label>
          <input type="checkbox" defaultChecked />
        </div>
        
        <div className="setting-item">
          <label>Trail Length (points)</label>
          <input type="number" defaultValue={100} min={10} max={1000} />
        </div>
      </div>
    </div>
  );

  const renderCameraSettings = () => (
    <div className="options-settings-content">
      <h2>Camera Settings</h2>
      
      <div className="settings-group">
        <h3>Video Stream</h3>
        <div className="setting-item">
          <label>Camera Rotation (degrees)</label>
          <select defaultValue={0}>
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Video Codec</label>
          <select defaultValue="H.264">
            <option value="H.264">H.264</option>
            <option value="H.265">H.265</option>
            <option value="MJPEG">MJPEG</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Video Quality</label>
          <select defaultValue="High">
            <option value="Low">Low (480p)</option>
            <option value="Medium">Medium (720p)</option>
            <option value="High">High (1080p)</option>
            <option value="Ultra">Ultra (4K)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderFlightSettings = () => (
    <div className="options-settings-content">
      <h2>Flight Settings</h2>
      
      <div className="settings-group">
        <h3>Safety Limits</h3>
        <div className="setting-item">
          <label>Maximum Altitude (m)</label>
          <input type="number" defaultValue={120} min={10} max={500} />
        </div>
        
        <div className="setting-item">
          <label>Maximum Distance (m)</label>
          <input type="number" defaultValue={500} min={50} max={2000} />
        </div>
        
        <div className="setting-item">
          <label>Return to Home Altitude (m)</label>
          <input type="number" defaultValue={30} min={5} max={100} />
        </div>
        
        <div className="setting-item">
          <label>Low Battery Warning (%)</label>
          <input type="number" defaultValue={20} min={5} max={50} />
        </div>
      </div>
    </div>
  );

  const renderTelemetrySettings = () => {
    if (!telemetrySettings) {
      return (
        <div className="options-settings-content">
          <h2>Telemetry Settings</h2>
          
          <div className="telemetry-load-section">
            <div className="load-message">
              <h3>📡 Telemetry Radio Configuration</h3>
              <p>Click "Load Settings" to read the current configuration from your telemetry radio.</p>
              <p>Make sure your telemetry radio is connected before loading settings.</p>
            </div>
            
            <div className="load-actions">
              <button 
                className="action-btn primary"
                onClick={loadTelemetrySettings}
                disabled={loadingSettings}
              >
                {loadingSettings ? 'Loading...' : 'Load Settings'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="options-settings-content">
        <h2>Telemetry Settings</h2>
        
        <div className="telemetry-layout">
          {/* Local Radio Settings */}
          <div className="telemetry-section">
            <h3>Local Radio Settings</h3>
            
            <div className="settings-group">
              <div className="setting-item">
                <label>Baud Rate</label>
                <select 
                  value={telemetrySettings.local.baudRate}
                  onChange={(e) => updateTelemetrySettings('local.baudRate', parseInt(e.target.value))}
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                  <option value={230400}>230400</option>
                  <option value={460800}>460800</option>
                  <option value={921600}>921600</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Air Speed</label>
                <select 
                  value={telemetrySettings.local.airSpeed}
                  onChange={(e) => updateTelemetrySettings('local.airSpeed', parseInt(e.target.value))}
                >
                  <option value={2}>2 kbps</option>
                  <option value={4}>4 kbps</option>
                  <option value={8}>8 kbps</option>
                  <option value={16}>16 kbps</option>
                  <option value={32}>32 kbps</option>
                  <option value={64}>64 kbps</option>
                  <option value={128}>128 kbps</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Network ID</label>
                <input 
                  type="number" 
                  value={telemetrySettings.local.networkId} 
                  min={0} 
                  max={255}
                  onChange={(e) => updateTelemetrySettings('local.networkId', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="setting-item">
                <label>Tx Power</label>
                <select 
                  value={telemetrySettings.local.txPower}
                  onChange={(e) => updateTelemetrySettings('local.txPower', parseInt(e.target.value))}
                >
                  <option value={1}>1 dBm</option>
                  <option value={2}>2 dBm</option>
                  <option value={5}>5 dBm</option>
                  <option value={8}>8 dBm</option>
                  <option value={11}>11 dBm</option>
                  <option value={14}>14 dBm</option>
                  <option value={17}>17 dBm</option>
                  <option value={20}>20 dBm</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>ECC</label>
                <input 
                  type="checkbox" 
                  checked={telemetrySettings.local.ecc}
                  onChange={(e) => updateTelemetrySettings('local.ecc', e.target.checked)}
                />
              </div>
              
              <div className="setting-item">
                <label>Mavlink</label>
                <select 
                  value={telemetrySettings.local.mavlink}
                  onChange={(e) => updateTelemetrySettings('local.mavlink', parseInt(e.target.value))}
                >
                  <option value={1}>MAVLink 1</option>
                  <option value={2}>MAVLink 2</option>
                  <option value={0}>Raw Data</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Op Resend</label>
                <input 
                  type="checkbox" 
                  checked={telemetrySettings.local.opResend}
                  onChange={(e) => updateTelemetrySettings('local.opResend', e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Remote Radio Settings */}
          <div className="telemetry-section">
            <h3>Remote Radio Settings</h3>
            
            <div className="settings-group">
              <div className="setting-item">
                <label>Air Speed</label>
                <select 
                  value={telemetrySettings.remote.airSpeed}
                  onChange={(e) => updateTelemetrySettings('remote.airSpeed', parseInt(e.target.value))}
                >
                  <option value={2}>2 kbps</option>
                  <option value={4}>4 kbps</option>
                  <option value={8}>8 kbps</option>
                  <option value={16}>16 kbps</option>
                  <option value={32}>32 kbps</option>
                  <option value={64}>64 kbps</option>
                  <option value={128}>128 kbps</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Network ID</label>
                <input 
                  type="number" 
                  value={telemetrySettings.remote.networkId} 
                  min={0} 
                  max={255}
                  onChange={(e) => updateTelemetrySettings('remote.networkId', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="setting-item">
                <label>Tx Power</label>
                <select 
                  value={telemetrySettings.remote.txPower}
                  onChange={(e) => updateTelemetrySettings('remote.txPower', parseInt(e.target.value))}
                >
                  <option value={1}>1 dBm</option>
                  <option value={2}>2 dBm</option>
                  <option value={5}>5 dBm</option>
                  <option value={8}>8 dBm</option>
                  <option value={11}>11 dBm</option>
                  <option value={14}>14 dBm</option>
                  <option value={17}>17 dBm</option>
                  <option value={20}>20 dBm</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>ECC</label>
                <input 
                  type="checkbox" 
                  checked={telemetrySettings.remote.ecc}
                  onChange={(e) => updateTelemetrySettings('remote.ecc', e.target.checked)}
                />
              </div>
              
              <div className="setting-item">
                <label>Mavlink</label>
                <select 
                  value={telemetrySettings.remote.mavlink}
                  onChange={(e) => updateTelemetrySettings('remote.mavlink', parseInt(e.target.value))}
                >
                  <option value={1}>MAVLink 1</option>
                  <option value={2}>MAVLink 2</option>
                  <option value={0}>Raw Data</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Op Resend</label>
                <input 
                  type="checkbox" 
                  checked={telemetrySettings.remote.opResend}
                  onChange={(e) => updateTelemetrySettings('remote.opResend', e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Stream Settings */}
        <div className="settings-group">
          <h3>MAVLink Data Stream</h3>
          <div className="setting-item">
            <label>Heartbeat Rate (Hz)</label>
            <input 
              type="number" 
              value={telemetrySettings.dataStream.heartbeatRate} 
              min={0.1} 
              max={10} 
              step={0.1}
              onChange={(e) => updateTelemetrySettings('dataStream.heartbeatRate', parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="setting-item">
            <label>Extended Status Rate (Hz)</label>
            <input 
              type="number" 
              value={telemetrySettings.dataStream.extendedStatusRate} 
              min={0} 
              max={50}
              onChange={(e) => updateTelemetrySettings('dataStream.extendedStatusRate', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="setting-item">
            <label>Position Rate (Hz)</label>
            <input 
              type="number" 
              value={telemetrySettings.dataStream.positionRate} 
              min={0} 
              max={50}
              onChange={(e) => updateTelemetrySettings('dataStream.positionRate', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="setting-item">
            <label>RC Channels Rate (Hz)</label>
            <input 
              type="number" 
              value={telemetrySettings.dataStream.rcChannelsRate} 
              min={0} 
              max={50}
              onChange={(e) => updateTelemetrySettings('dataStream.rcChannelsRate', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="setting-item">
            <label>Raw Sensor Rate (Hz)</label>
            <input 
              type="number" 
              value={telemetrySettings.dataStream.rawSensorRate} 
              min={0} 
              max={50}
              onChange={(e) => updateTelemetrySettings('dataStream.rawSensorRate', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Radio Actions */}
        <div className="settings-group">
          <h3>Radio Configuration</h3>
          <div className="telemetry-actions">
            <button 
              className="action-btn primary"
              onClick={loadTelemetrySettings}
              disabled={loadingSettings}
            >
              {loadingSettings ? 'Loading...' : 'Reload Settings'}
            </button>
            <button 
              className="action-btn success"
              onClick={saveTelemetrySettings}
            >
              Save Settings to Radio
            </button>
            <button 
              className="action-btn secondary"
              onClick={loadTelemetryFromFile}
            >
              Load from File
            </button>
            <button 
              className="action-btn secondary"
              onClick={saveTelemetryToFile}
            >
              Save to File
            </button>
            <button 
              className="action-btn primary"
              onClick={copyToRemote}
            >
              Copy Required to Remote
            </button>
            <button 
              className="action-btn warning"
              onClick={resetTelemetryDefaults}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAdvancedSettings = () => (
    <div className="options-settings-content">
      <h2>Advanced Settings</h2>
      
      <div className="settings-group">
        <h3>Developer Options</h3>
        <div className="setting-item">
          <label>Debug Mode</label>
          <input type="checkbox" />
        </div>
        
        <div className="setting-item">
          <label>Telemetry Rate (Hz)</label>
          <input type="number" defaultValue={10} min={1} max={50} />
        </div>
        
        <div className="setting-item">
          <label>Parameter Timeout (s)</label>
          <input type="number" defaultValue={30} min={5} max={120} />
        </div>
      </div>
      
      <div className="settings-group">
        <h3>Data Management</h3>
        <div className="setting-item">
          <button className="action-btn danger">Reset All Settings</button>
        </div>
        <div className="setting-item">
          <button className="action-btn primary">Export Settings</button>
        </div>
        <div className="setting-item">
          <button className="action-btn secondary">Import Settings</button>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="options-settings-content">
      <h2>About SkyPulse</h2>
      
      <div className="settings-group">
        <h3>Application Information</h3>
        <div className="about-item">
          <label>Version:</label>
          <span>1.0.0</span>
        </div>
        <div className="about-item">
          <label>Build:</label>
          <span>2024.01.001</span>
        </div>
        <div className="about-item">
          <label>Platform:</label>
          <span>Electron + React</span>
        </div>
        <div className="about-item">
          <label>MAVLink:</label>
          <span>v2.0 Compatible</span>
        </div>
      </div>
      
      <div className="settings-group">
        <h3>System Information</h3>
        <div className="about-item">
          <label>Operating System:</label>
          <span>Windows 10</span>
        </div>
        <div className="about-item">
          <label>Memory Usage:</label>
          <span>125 MB</span>
        </div>
        <div className="about-item">
          <label>Uptime:</label>
          <span>02:34:15</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general': return renderGeneralSettings();
      case 'connection': return renderConnectionSettings();
      case 'display': return renderDisplaySettings();
      case 'map': return renderMapSettings();
      case 'camera': return renderCameraSettings();
      case 'flight': return renderFlightSettings();
      case 'telemetry': return renderTelemetrySettings();
      case 'advanced': return renderAdvancedSettings();
      case 'about': return renderAbout();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="options-container">
      <div className="options-sidebar">
        <div className="options-header">
          <h2>Settings</h2>
        </div>
        
        <div className="options-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="options-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default Options; 