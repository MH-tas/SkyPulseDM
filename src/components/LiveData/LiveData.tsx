import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './LiveData.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

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

interface LiveDataProps {
  telemetry: RealTelemetryData;
  connected: boolean;
}

interface DataPoint {
  timestamp: string;
  value: number;
}

const LiveData: React.FC<LiveDataProps> = ({ telemetry, connected }) => {
  // Data history arrays (last 50 points)
  const [altitudeHistory, setAltitudeHistory] = useState<DataPoint[]>([]);
  const [batteryHistory, setBatteryHistory] = useState<DataPoint[]>([]);
  const [speedHistory, setSpeedHistory] = useState<DataPoint[]>([]);
  const [voltageHistory, setVoltageHistory] = useState<DataPoint[]>([]);
  const [rssiHistory, setRssiHistory] = useState<DataPoint[]>([]);
  const [attitudeHistory, setAttitudeHistory] = useState<{
    roll: DataPoint[];
    pitch: DataPoint[];
    yaw: DataPoint[];
  }>({
    roll: [],
    pitch: [],
    yaw: []
  });

  const MAX_DATA_POINTS = 50;

  // Update data history when telemetry changes
  useEffect(() => {
    if (!connected) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    // Altitude history
    setAltitudeHistory(prev => {
      const newData = [...prev, { timestamp, value: telemetry.altitude }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Battery history
    setBatteryHistory(prev => {
      const newData = [...prev, { timestamp, value: telemetry.battery }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Speed history
    setSpeedHistory(prev => {
      const newData = [...prev, { timestamp, value: telemetry.groundSpeed }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Voltage history
    setVoltageHistory(prev => {
      const newData = [...prev, { timestamp, value: telemetry.voltage }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // RSSI history
    setRssiHistory(prev => {
      const newData = [...prev, { timestamp, value: telemetry.rssi }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    // Attitude history
    setAttitudeHistory(prev => ({
      roll: [...prev.roll, { timestamp, value: telemetry.roll }].slice(-MAX_DATA_POINTS),
      pitch: [...prev.pitch, { timestamp, value: telemetry.pitch }].slice(-MAX_DATA_POINTS),
      yaw: [...prev.yaw, { timestamp, value: telemetry.yaw }].slice(-MAX_DATA_POINTS)
    }));

  }, [telemetry, connected]);

  // Clear data when disconnected
  useEffect(() => {
    if (!connected) {
      setAltitudeHistory([]);
      setBatteryHistory([]);
      setSpeedHistory([]);
      setVoltageHistory([]);
      setRssiHistory([]);
      setAttitudeHistory({ roll: [], pitch: [], yaw: [] });
    }
  }, [connected]);

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: { size: 10 }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#ccc', font: { size: 8 } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: '#ccc', font: { size: 8 } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    },
    animation: {
      duration: 0
    }
  };

  // Battery doughnut chart
  const batteryChartData = {
    labels: ['Battery', 'Used'],
    datasets: [
      {
        data: [telemetry.battery, 100 - telemetry.battery],
        backgroundColor: [
          telemetry.battery > 50 ? '#4CAF50' : telemetry.battery > 20 ? '#FF9800' : '#F44336',
          'rgba(255,255,255,0.1)'
        ],
        borderColor: [
          telemetry.battery > 50 ? '#4CAF50' : telemetry.battery > 20 ? '#FF9800' : '#F44336',
          'rgba(255,255,255,0.2)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
          font: { size: 10 }
        }
      },
    },
    cutout: '70%'
  };

  // Altitude chart
  const altitudeChartData = {
    labels: altitudeHistory.map(d => d.timestamp),
    datasets: [
      {
        label: 'Altitude (m)',
        data: altitudeHistory.map(d => d.value),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Speed chart
  const speedChartData = {
    labels: speedHistory.map(d => d.timestamp),
    datasets: [
      {
        label: 'Ground Speed (m/s)',
        data: speedHistory.map(d => d.value),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Voltage chart
  const voltageChartData = {
    labels: voltageHistory.map(d => d.timestamp),
    datasets: [
      {
        label: 'Voltage (V)',
        data: voltageHistory.map(d => d.value),
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // RSSI chart
  const rssiChartData = {
    labels: rssiHistory.map(d => d.timestamp),
    datasets: [
      {
        label: 'RSSI (dBm)',
        data: rssiHistory.map(d => d.value),
        borderColor: '#E91E63',
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Attitude chart (Roll, Pitch, Yaw)
  const attitudeChartData = {
    labels: attitudeHistory.roll.map(d => d.timestamp),
    datasets: [
      {
        label: 'Roll (°)',
        data: attitudeHistory.roll.map(d => d.value),
        borderColor: '#FF5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Pitch (°)',
        data: attitudeHistory.pitch.map(d => d.value),
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Yaw (°)',
        data: attitudeHistory.yaw.map(d => d.value),
        borderColor: '#607D8B',
        backgroundColor: 'rgba(96, 125, 139, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // System status bar chart
  const systemStatsData = {
    labels: ['GPS Sats', 'Signal', 'Throttle', 'Battery'],
    datasets: [
      {
        label: 'System Status',
        data: [
          telemetry.satellites,
          Math.abs(telemetry.rssi),
          telemetry.throttle,
          telemetry.battery
        ],
        backgroundColor: [
          telemetry.satellites >= 6 ? '#4CAF50' : '#F44336',
          Math.abs(telemetry.rssi) > 50 ? '#4CAF50' : '#F44336',
          '#2196F3',
          telemetry.battery > 50 ? '#4CAF50' : telemetry.battery > 20 ? '#FF9800' : '#F44336'
        ],
        borderColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
    },
    scales: {
      x: {
        ticks: { color: '#ccc', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: '#ccc', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        beginAtZero: true
      }
    },
    animation: {
      duration: 300
    }
  };

  // Status indicator component
  const StatusIndicator = ({ label, value, unit = '', status }: {
    label: string;
    value: string | number;
    unit?: string;
    status: 'good' | 'warning' | 'danger' | 'neutral';
  }) => (
    <div className={`status-indicator ${status}`}>
      <div className="status-label">{label}</div>
      <div className="status-value">{value}{unit}</div>
      <div className={`status-light ${status}`}></div>
    </div>
  );

  return (
    <div className="live-data-container">
      <div className="live-data-header">
        <h2>🔴 LIVE DATA MONITORING</h2>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {!connected ? (
        <div className="preview-mode">
          <div className="preview-header">
            <h3>📊 LIVE DATA PREVIEW MODE</h3>
            <p>Connect to your drone to see real-time telemetry data and charts</p>
          </div>

          {/* Preview Charts - Organized Grid */}
          <div className="preview-charts-grid">
            
            {/* Row 1 - Primary Flight Data */}
            <div className="chart-row">
              <div className="chart-widget preview">
                <h3>🔋 Battery Status</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Battery %, Voltage, Current</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget preview">
                <h3>📈 Altitude</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Height (m), Climb Rate</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget preview">
                <h3>🚀 Speed</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Ground Speed, Air Speed</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 - System Monitoring */}
            <div className="chart-row">
              <div className="chart-widget preview">
                <h3>📶 Signal (RSSI)</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Radio Signal Strength</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget preview">
                <h3>⚡ Voltage</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Power System Voltage</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget preview">
                <h3>🛰️ GPS Status</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Satellites, GPS Quality</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3 - Attitude & System */}
            <div className="chart-row">
              <div className="chart-widget preview span-2">
                <h3>🎯 Attitude Control (Roll/Pitch/Yaw)</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Aircraft Orientation: Roll, Pitch, Yaw angles in degrees</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget preview">
                <h3>⚙️ System Health</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder">
                    <div className="placeholder-chart">📊</div>
                    <div className="data-info">
                      <p>Throttle, Failsafe, Status</p>
                    </div>
                    <div className="connect-message">Connect to see live data</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4 - Statistics */}
            <div className="chart-row">
              <div className="chart-widget preview span-3">
                <h3>📊 Flight Statistics & Records</h3>
                <div className="chart-preview-simple">
                  <div className="preview-placeholder stats-placeholder">
                    <div className="stats-preview-grid">
                      <div className="stat-preview">Max Altitude</div>
                      <div className="stat-preview">Max Speed</div>
                      <div className="stat-preview">Min Battery</div>
                      <div className="stat-preview">Avg Voltage</div>
                      <div className="stat-preview">Flight Time</div>
                      <div className="stat-preview">Data Points</div>
                    </div>
                    <div className="connect-message">Connect to see live statistics</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Connection Instructions */}
          <div className="connection-instructions">
            <h3>🔌 HOW TO START MONITORING</h3>
            <div className="instructions-grid">
              <div className="instruction-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Connect Telemetry</h4>
                  <p>Plug your SiK/3DR telemetry radio into USB port</p>
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Select Port & Baudrate</h4>
                  <p>Choose the correct COM port and baud rate in header</p>
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Connect</h4>
                  <p>Click CONN button to establish MAVLink connection</p>
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Live Data</h4>
                  <p>Charts will automatically update with real-time data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Status Overview Panel */}
          <div className="status-overview">
            <StatusIndicator 
              label="Flight Mode" 
              value={telemetry.mode} 
              status={telemetry.armed ? 'warning' : 'neutral'} 
            />
            <StatusIndicator 
              label="Battery" 
              value={telemetry.battery} 
              unit="%" 
              status={telemetry.battery > 50 ? 'good' : telemetry.battery > 20 ? 'warning' : 'danger'} 
            />
            <StatusIndicator 
              label="Altitude" 
              value={telemetry.altitude.toFixed(1)} 
              unit=" m" 
              status="neutral" 
            />
            <StatusIndicator 
              label="Speed" 
              value={telemetry.groundSpeed.toFixed(1)} 
              unit=" m/s" 
              status="neutral" 
            />
            <StatusIndicator 
              label="Satellites" 
              value={telemetry.satellites} 
              status={telemetry.satellites >= 6 ? 'good' : 'warning'} 
            />
            <StatusIndicator 
              label="RSSI" 
              value={telemetry.rssi} 
              unit=" dBm" 
              status={Math.abs(telemetry.rssi) < 70 ? 'good' : Math.abs(telemetry.rssi) < 90 ? 'warning' : 'danger'} 
            />
          </div>

          {/* Charts Grid - Organized Layout */}
          <div className="charts-grid">
            
            {/* Row 1 - Primary Flight Data */}
            <div className="chart-row">
              <div className="chart-widget">
                <h3>🔋 Battery Status</h3>
                <div className="chart-container">
                  <Doughnut data={batteryChartData} options={doughnutOptions} />
                  <div className="chart-center-text">
                    <div className="battery-percentage">{telemetry.battery}%</div>
                    <div className="battery-voltage">{telemetry.voltage.toFixed(2)}V</div>
                  </div>
                </div>
              </div>

              <div className="chart-widget">
                <h3>📈 Altitude</h3>
                <div className="chart-container">
                  <Line data={altitudeChartData} options={lineChartOptions} />
                </div>
              </div>

              <div className="chart-widget">
                <h3>🚀 Speed</h3>
                <div className="chart-container">
                  <Line data={speedChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>

            {/* Row 2 - System Monitoring */}
            <div className="chart-row">
              <div className="chart-widget">
                <h3>📶 Signal (RSSI)</h3>
                <div className="chart-container">
                  <Line data={rssiChartData} options={lineChartOptions} />
                </div>
              </div>

              <div className="chart-widget">
                <h3>⚡ Voltage</h3>
                <div className="chart-container">
                  <Line data={voltageChartData} options={lineChartOptions} />
                </div>
              </div>

              <div className="chart-widget">
                <h3>⚙️ System Health</h3>
                <div className="chart-container">
                  <Bar data={systemStatsData} options={barChartOptions} />
                </div>
              </div>
            </div>

            {/* Row 3 - Attitude Control */}
            <div className="chart-row">
              <div className="chart-widget span-3">
                <h3>🎯 Attitude Control (Roll/Pitch/Yaw)</h3>
                <div className="chart-container">
                  <Line data={attitudeChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>

            {/* Row 4 - Flight Statistics */}
            <div className="chart-row">
              <div className="chart-widget stats-widget span-3">
                <h3>📊 Flight Statistics & Records</h3>
                <div className="chart-container">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Max Altitude:</span>
                      <span className="stat-value">{Math.max(...altitudeHistory.map(d => d.value), 0).toFixed(1)} m</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Max Speed:</span>
                      <span className="stat-value">{Math.max(...speedHistory.map(d => d.value), 0).toFixed(1)} m/s</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Min Battery:</span>
                      <span className="stat-value">{Math.min(...batteryHistory.map(d => d.value), 100).toFixed(0)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Voltage:</span>
                      <span className="stat-value">
                        {voltageHistory.length > 0 
                          ? (voltageHistory.reduce((a, b) => a + b.value, 0) / voltageHistory.length).toFixed(2)
                          : '0.00'} V
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Flight Time:</span>
                      <span className="stat-value">{Math.floor(altitudeHistory.length * 2 / 60)}:{String(Math.floor(altitudeHistory.length * 2 % 60)).padStart(2, '0')}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Data Points:</span>
                      <span className="stat-value">{altitudeHistory.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default LiveData; 