import React, { useRef } from 'react';
import { Download } from 'lucide-react';

const FileUpload = ({ onFileUpload, loading }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-container">
      <div className="upload-box">
        <Download size={64} strokeWidth={1.5} style={{ marginBottom: '1rem', color: '#6b7280' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Upload Your Web Vitals Data</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Select a CSV file containing your performance metrics
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          style={{ display: 'none' }}
          disabled={loading}
        />
        <button
          onClick={handleClick}
          className="upload-button"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Choose CSV File'}
        </button>
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'left' }}>
          <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Expected CSV format:</p>
          <pre style={{
            backgroundColor: '#f9fafb',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            overflow: 'auto'
          }}>
{`# Brand: BrandName,,,
date,largestContentfulPaint,cumulativeLayoutShift,Release
01/01/2024,2500,0.05,v1.0.0
02/01/2024,2400,0.04,`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
