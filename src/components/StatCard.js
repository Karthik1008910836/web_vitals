import React from 'react';

const StatCard = ({ title, stats, isLCP = false }) => {
  const formatValue = (value, isCLS = false) => {
    if (isCLS) {
      return typeof value === 'string' ? value : value.toFixed(4);
    }
    return `${value}ms`;
  };

  const getStatusColor = (value, metric) => {
    if (metric === 'LCP') {
      if (value <= 2500) return '#10b981';
      if (value <= 4000) return '#f59e0b';
      return '#ef4444';
    } else {
      if (value <= 0.1) return '#10b981';
      if (value <= 0.25) return '#f59e0b';
      return '#ef4444';
    }
  };

  const metricType = isLCP ? 'LCP' : 'CLS';
  const p80Value = isLCP ? stats.p80 : parseFloat(stats.p80);

  return (
    <div className="stat-card">
      <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>{title}</h3>
      <div className="stat-item">
        <span className="stat-label">80th Percentile:</span>
        <span className="stat-value" style={{ color: getStatusColor(p80Value, metricType) }}>
          {formatValue(stats.p80, !isLCP)}
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Range:</span>
        <span className="stat-value">
          {formatValue(stats.min, !isLCP)} - {formatValue(stats.max, !isLCP)}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
