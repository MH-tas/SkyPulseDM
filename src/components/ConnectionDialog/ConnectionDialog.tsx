import React from 'react';
import './ConnectionDialog.css';

interface ConnectionDialogProps {
  isVisible: boolean;
  progress: string;
  onCancel: () => void;
  connectionState: 'idle' | 'connecting' | 'connected' | 'failed';
}

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  isVisible,
  progress,
  onCancel,
  connectionState
}) => {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connecting':
        return '⟳';
      case 'connected':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '⟳';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connecting':
        return '#00e6ff';
      case 'connected':
        return '#00ff41';
      case 'failed':
        return '#ff3030';
      default:
        return '#00e6ff';
    }
  };

  return (
    <div className="connection-dialog-overlay">
      <div className="connection-dialog">
        <div className="dialog-header">
          <h3>MAVLink Connection</h3>
          <div 
            className="status-icon"
            style={{ color: getStatusColor() }}
          >
            {getStatusIcon()}
          </div>
        </div>

        <div className="dialog-content">
          <div className="progress-section">
            <div className="progress-text">{progress || 'Initializing...'}</div>
            
            {connectionState === 'connecting' && (
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            )}
          </div>

          {connectionState === 'connecting' && (
            <div className="dialog-actions">
              <button 
                onClick={onCancel}
                className="cancel-button"
              >
                CANCEL CONNECTION
              </button>
            </div>
          )}
          
          {connectionState === 'failed' && (
            <div className="dialog-actions">
              <button 
                onClick={onCancel}
                className="close-button"
              >
                CLOSE
              </button>
            </div>
          )}
          
          {connectionState === 'connected' && (
            <div className="success-message">
              <p>✅ MAVLink connection established successfully!</p>
              <p>Telemetry data is now streaming...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDialog; 