import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HUD from './HUD/HUD';
import CircularGauge from './Gauges/CircularGauge';
import Simple3DViewer from './Simple3D/Simple3DViewer';
import './DroneController.css';

// Electron IPC tiplerini tanımlayalım
declare global {
  interface Window {
    require?: any;
  }
}

interface TelemetryData {
  altitude: number;
  speed: number;
  battery: number;
  gpsLat: number;
  gpsLon: number;
  heading: number;
  mode: string;
  armed: boolean;
  satellites: number;
}

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

// Gerçek MAVLink telemetry interface
interface RealTelemetryData {
  altitude: number;
  speed: number;
  battery: number;
  voltage: number;
  current: number;
  gpsLat: number;
  gpsLon: number;
  gpsAlt: number;
  heading: number;
  roll: number;
  pitch: number;
  yaw: number;
  mode: string;
  armed: boolean;
  satellites: number;
  gpsStatus: number;
  groundSpeed: number;
  airSpeed: number;
  climbRate: number;
  throttle: number;
  rssi: number;
  failsafe: boolean;
  systemStatus: number;
  flightMode: number;
  lastHeartbeat: number;
}

interface DroneControllerProps {
  onConnectionChange: (connected: boolean) => void;
  availablePorts: SerialPortInfo[];
  setAvailablePorts: React.Dispatch<React.SetStateAction<SerialPortInfo[]>>;
  connected: boolean;
  selectedPort: string;
  selectedBaudrate: number;
  setSelectedPort: React.Dispatch<React.SetStateAction<string>>;
  connecting: boolean;
  setConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  onConnect: () => void;
  onDisconnect: () => void;
  telemetry: RealTelemetryData;
}

const DroneController: React.FC<DroneControllerProps> = ({
  onConnectionChange,
  availablePorts,
  setAvailablePorts,
  connected,
  selectedPort,
  selectedBaudrate,
  setSelectedPort,
  connecting,
  setConnecting,
  onConnect,
  onDisconnect,
  telemetry
}) => {
  const [newPortDetected, setNewPortDetected] = useState<{path: string, name: string} | null>(null);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [commandStatus, setCommandStatus] = useState('');

  // Custom drone icon for Leaflet with rotation based on heading
  const droneIcon = new L.DivIcon({
    html: `<div style="
      color: #ffaa00; 
      font-size: 28px; 
      text-shadow: 0 0 12px rgba(255, 170, 0, 0.9), 0 0 20px rgba(255, 170, 0, 0.5);
      transform: rotate(${telemetry.heading}deg);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: radial-gradient(circle, rgba(255, 170, 0, 0.2) 0%, transparent 70%);
      border-radius: 50%;
      border: 2px solid rgba(255, 170, 0, 0.3);
    ">✈</div>`,
    className: 'custom-drone-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Electron IPC setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      
      // İlk port listesini al
      const loadInitialPorts = async () => {
        try {
          const ports = await ipcRenderer.invoke('get-ports');
          setAvailablePorts(ports);
        } catch (error) {
          console.error('Port listesi alma hatası:', error);
        }
      };

      // Port güncellemelerini dinle
      const handlePortsUpdate = (event: any, ports: SerialPortInfo[]) => {
        const previousPortPaths = availablePorts.map(p => p.path);
        const newPortPaths = ports.map(p => p.path);
        
        // Yeni port tespit edildi mi?
        const addedPorts = newPortPaths.filter(path => !previousPortPaths.includes(path));
        
        if (addedPorts.length > 0) {
          const newPort = ports.find(p => p.path === addedPorts[0]);
          const displayName = newPort?.friendlyName || addedPorts[0];
          setNewPortDetected({ path: addedPorts[0], name: displayName });
          // 3 saniye sonra bildirimi temizle
          setTimeout(() => setNewPortDetected(null), 3000);
        }
        
        setAvailablePorts(ports);
      };

      loadInitialPorts();
      ipcRenderer.on('ports-updated', handlePortsUpdate);

      // Cleanup
      return () => {
        ipcRenderer.removeListener('ports-updated', handlePortsUpdate);
      };
    }
  }, [availablePorts]);

  // Update map container data attribute for CSS targeting
  useEffect(() => {
    const mapContainer = document.querySelector('.drone-map');
    if (mapContainer) {
      mapContainer.setAttribute('data-layer', mapLayer);
    }
  }, [mapLayer]);

  // Drone command functions
  const handleArmDrone = async () => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('arm-drone');
        setCommandStatus(result.message);
        
        if (result.success) {
          console.log('ARM command sent successfully');
        }
      } catch (error) {
        setCommandStatus('ARM command failed');
        console.error('ARM command error:', error);
      }
    } else {
      setCommandStatus('Electron required for drone commands');
    }
  };

  const handleDisarmDrone = async () => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('disarm-drone');
        setCommandStatus(result.message);
        
        if (result.success) {
          console.log('DISARM command sent successfully');
        }
      } catch (error) {
        setCommandStatus('DISARM command failed');
        console.error('DISARM command error:', error);
      }
    } else {
      setCommandStatus('Electron required for drone commands');
    }
  };

  const handleTakeoff = async () => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('takeoff-drone', 10); // 10 meter takeoff
        setCommandStatus(result.message);
        
        if (result.success) {
          console.log('TAKEOFF command sent successfully');
        }
      } catch (error) {
        setCommandStatus('TAKEOFF command failed');
        console.error('TAKEOFF command error:', error);
      }
    } else {
      setCommandStatus('Electron required for drone commands');
    }
  };

  const handleLand = async () => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('land-drone');
        setCommandStatus(result.message);
        
        if (result.success) {
          console.log('LAND command sent successfully');
        }
      } catch (error) {
        setCommandStatus('LAND command failed');
        console.error('LAND command error:', error);
      }
    } else {
      setCommandStatus('Electron required for drone commands');
    }
  };

  // Clear command status after 5 seconds
  useEffect(() => {
    if (commandStatus) {
      const timer = setTimeout(() => {
        setCommandStatus('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [commandStatus]);

  // Map tile URLs with sci-fi styling
  const getTileUrl = () => {
    switch (mapLayer) {
      case 'satellite':
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
        };
      case 'terrain':
        return {
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
      default: // Sci-fi dark streets
        return {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
    }
  };

  return (
    <div className="drone-controller">
      {/* Yeni Port Bildirimi */}
      {newPortDetected && (
        <div className="new-port-notification">
          <div className="notification-content">
            <span>Yeni cihaz tespit edildi: <strong>{newPortDetected.name}</strong></span>
            <button 
              onClick={() => setSelectedPort(newPortDetected.path)}
              className="auto-connect-btn"
            >
              Otomatik Bağlan
            </button>
            <button 
              onClick={() => setNewPortDetected(null)}
              className="dismiss-btn"
            >
              X
            </button>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Sol: Telemetri Paneli (30%) */}
        <div className="telemetry-panel">
          <h3>TELEMETRY</h3>
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="label">Altitude:</span>
              <span className="value">{telemetry.altitude.toFixed(1)} m</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Ground Speed:</span>
              <span className="value">{telemetry.groundSpeed.toFixed(1)} m/s</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Air Speed:</span>
              <span className="value">{telemetry.airSpeed.toFixed(1)} m/s</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Battery:</span>
              <span className="value">{telemetry.battery}%</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Voltage:</span>
              <span className="value">{telemetry.voltage.toFixed(2)}V</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Current:</span>
              <span className="value">{telemetry.current.toFixed(2)}A</span>
            </div>
            <div className="telemetry-item">
              <span className="label">GPS Lat:</span>
              <span className="value">{telemetry.gpsLat.toFixed(6)}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">GPS Lon:</span>
              <span className="value">{telemetry.gpsLon.toFixed(6)}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Heading:</span>
              <span className="value">{telemetry.heading.toFixed(0)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Roll:</span>
              <span className="value">{telemetry.roll.toFixed(1)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Pitch:</span>
              <span className="value">{telemetry.pitch.toFixed(1)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Mode:</span>
              <span className="value">{telemetry.mode}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Armed:</span>
              <span className="value">{telemetry.armed ? 'YES' : 'NO'}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Satellites:</span>
              <span className="value">{telemetry.satellites}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">RSSI:</span>
              <span className="value">{telemetry.rssi}</span>
            </div>
            <div className="telemetry-item">
              <span className="label">Throttle:</span>
              <span className="value">{telemetry.throttle}%</span>
            </div>
          </div>
          
          {/* Flight Instruments Gauges */}
          <div className="flight-gauges">
            <h4>FLIGHT INSTRUMENTS</h4>
            <div className="gauges-grid">
              <CircularGauge
                title="SPEED"
                value={telemetry.groundSpeed}
                min={0}
                max={50}
                unit="m/s"
                type="speed"
                size={117}
              />
              <CircularGauge
                title="ALT"
                value={telemetry.altitude}
                min={0}
                max={200}
                unit="m"
                type="altitude"
                size={117}
              />
              <CircularGauge
                title="BAT"
                value={telemetry.battery}
                min={0}
                max={100}
                unit="%"
                type="speed"
                size={117}
              />
              <CircularGauge
                title="HDG"
                value={telemetry.heading}
                min={0}
                max={360}
                unit="°"
                type="compass"
                size={117}
              />
            </div>
          </div>
          
          {/* 3D Model Viewer */}
          <div className="model-3d-section">
            <h4>3D DRONE MODEL</h4>
            <Simple3DViewer
              width={280}
              height={200}
              autoRotate={false} // Never auto-rotate - always use real telemetry
              modelPath="/Drone.obj"
              pitch={telemetry.pitch}
              roll={telemetry.roll}
              yaw={telemetry.yaw}
            />
          </div>
        </div>

        {/* Orta: Control + HUD Column (30%) */}
        <div className="center-column">
          {/* Kontrol Paneli */}
          <div className="control-panel">
            <h3>FLIGHT CONTROL</h3>
            <div className="control-buttons">
              <button 
                className={`control-btn arm-btn ${telemetry.armed ? 'armed' : ''}`}
                onClick={telemetry.armed ? handleDisarmDrone : handleArmDrone}
                disabled={!connected}
              >
                {telemetry.armed ? 'DISARM' : 'ARM'}
              </button>
              <button 
                className="control-btn takeoff-btn"
                onClick={handleTakeoff}
                disabled={!connected || !telemetry.armed}
              >
                TAKEOFF
              </button>
              <button 
                className="control-btn land-btn"
                onClick={handleLand}
                disabled={!connected || telemetry.altitude < 1}
              >
                LAND
              </button>
            </div>
          </div>

          {/* HUD Panel */}
          <div className="hud-panel">
            <h3>HEADS-UP DISPLAY</h3>
            <HUD connected={connected} telemetry={{
              heading: telemetry.heading,
              altitude: telemetry.altitude,
              speed: telemetry.groundSpeed,
              mode: telemetry.mode,
              armed: telemetry.armed,
              satellites: telemetry.satellites,
              battery: telemetry.battery,
              gpsLat: telemetry.gpsLat,
              gpsLon: telemetry.gpsLon,
              pitch: telemetry.pitch,
              roll: telemetry.roll
            }} />
          </div>
        </div>

        {/* Sağ: GPS Harita (40%) */}
        <div className="map-panel">
          <h3>GPS POSITION MAP</h3>
          <div className="map-container">
            {/* Map Layer Toggle Buttons */}
            <div className="map-layer-controls">
              <button 
                className={`layer-btn ${mapLayer === 'streets' ? 'active' : ''}`}
                onClick={() => setMapLayer('streets')}
              >
                STREETS
              </button>
              <button 
                className={`layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapLayer('satellite')}
              >
                SATELLITE
              </button>
              <button 
                className={`layer-btn ${mapLayer === 'terrain' ? 'active' : ''}`}
                onClick={() => setMapLayer('terrain')}
              >
                TERRAIN
              </button>
            </div>

            <MapContainer
              center={[telemetry.gpsLat || 39.9334, telemetry.gpsLon || 32.8597]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="drone-map"
              attributionControl={false} // Custom attribution in overlay
            >
              <TileLayer
                key={mapLayer}
                attribution={getTileUrl().attribution}
                url={getTileUrl().url}
                maxZoom={19}
              />
              {connected && telemetry.gpsLat !== 0 && telemetry.gpsLon !== 0 && (
                <Marker 
                  position={[telemetry.gpsLat, telemetry.gpsLon]} 
                  icon={droneIcon}
                >
                  <Popup>
                    <div className="drone-popup">
                      <strong>Drone Position</strong><br/>
                      Lat: {telemetry.gpsLat.toFixed(6)}<br/>
                      Lng: {telemetry.gpsLon.toFixed(6)}<br/>
                      Alt: {telemetry.altitude.toFixed(1)}m<br/>
                      Speed: {telemetry.groundSpeed.toFixed(1)} m/s<br/>
                      Heading: {telemetry.heading.toFixed(0)}°<br/>
                      Mode: {telemetry.mode}<br/>
                      Armed: {telemetry.armed ? 'YES' : 'NO'}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
            <div className="coordinates-overlay">
              <div>LAT: {telemetry.gpsLat.toFixed(6)}</div>
              <div>LNG: {telemetry.gpsLon.toFixed(6)}</div>
              <div>ALT: {telemetry.altitude.toFixed(1)}m</div>
              <div>GPS: {telemetry.satellites} sats</div>
              <div>MODE: {telemetry.mode}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneController; 