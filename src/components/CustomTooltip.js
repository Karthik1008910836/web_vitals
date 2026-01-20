import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold' }}>{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}${entry.dataKey === 'LCP' ? 'ms' : ''}`}
          </p>
        ))}
        {data.Release && (
          <p style={{ color: '#2563eb', fontWeight: '500' }}>{`Release: ${data.Release}`}</p>
        )}
        {data.BrandName && (
          <p style={{ color: '#059669', fontWeight: '500' }}>{`Brand: ${data.BrandName}`}</p>
        )}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
