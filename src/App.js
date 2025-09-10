import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Calendar, Filter, Download, Camera, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import './index.css';

const WebVitalsDashboard = () => {
  const [csvData, setCsvData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('both');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('webVitalsData');
    const savedStartDate = localStorage.getItem('webVitalsStartDate');
    const savedEndDate = localStorage.getItem('webVitalsEndDate');
    const savedMetric = localStorage.getItem('webVitalsSelectedMetric');
    const savedBrand = localStorage.getItem('webVitalsSelectedBrand');

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const dataWithDates = parsedData.map(item => ({
          ...item,
          dateObj: new Date(item.Date),
        }));
        setCsvData(dataWithDates);
        setFileUploaded(true);

        if (savedStartDate) setStartDate(savedStartDate);
        if (savedEndDate) setEndDate(savedEndDate);
        if (savedMetric) setSelectedMetric(savedMetric);
        if (savedBrand) setSelectedBrand(savedBrand);
      } catch (e) {
        console.error("Failed to parse CSV data from localStorage", e);
        localStorage.removeItem('webVitalsData');
        setFileUploaded(false);
      }
    }
  }, []);

  useEffect(() => {
    if (fileUploaded) {
      localStorage.setItem('webVitalsData', JSON.stringify(csvData));
      localStorage.setItem('webVitalsStartDate', startDate);
      localStorage.setItem('webVitalsEndDate', endDate);
      localStorage.setItem('webVitalsSelectedMetric', selectedMetric);
      localStorage.setItem('webVitalsSelectedBrand', selectedBrand);

      let currentData = csvData;

      // Filter by brand
      if (selectedBrand !== 'all') {
        currentData = currentData.filter(item => item.Brand === selectedBrand);
      }

      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        currentData = currentData.filter(item => {
          const itemDate = new Date(item.Date);
          return itemDate >= start && itemDate <= end;
        });
      }

      setFilteredData(currentData);
    }
  }, [csvData, startDate, endDate, selectedMetric, selectedBrand, fileUploaded]);

  const handleFileUpload = (event) => {
    setLoading(true);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(header => header.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(val => val.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });

      setCsvData(data);
      setFileUploaded(true);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Brand', 'Release', 'LCP', 'FID'];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + '\n'
      + filteredData.map(e => headers.map(header => e[header]).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "web-vitals-data.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleDownloadChart = () => {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
      html2canvas(chartContainer).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'web-vitals-chart.png';
        link.click();
      });
    }
  };

  const brands = useMemo(() => {
    const allBrands = csvData.map(item => item.Brand);
    return ['all', ...new Set(allBrands)].filter(brand => brand !== undefined && brand !== null && brand !== '');
  }, [csvData]);
  
  const renderReleaseTag = (props) => {
    const { x, y, value, payload } = props;
    if (payload.Release) {
      return (
        <g transform={`translate(${x},${y - 15})`}>
          <rect x="-15" y="-12" width="30" height="15" fill="#dbeafe" rx="3" />
          <text x="0" y="0" dy="-2" fill="#1e40af" textAnchor="middle" fontSize="10">
            {payload.Release}
          </text>
        </g>
      );
    }
    return null;
  };

  return (
    <div className="web-vitals-dashboard">
      <div className="header">
        <h1>Web Vitals Dashboard</h1>
        <div className="header-controls">
          <label className="file-upload-button">
            Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} />
          </label>
          <button className="download-button" onClick={handleDownloadCSV} disabled={!fileUploaded}>
            <Download size={16} /> Download CSV
          </button>
          <button className="download-button" onClick={handleDownloadChart} disabled={!fileUploaded}>
            <Camera size={16} /> Download Chart
          </button>
        </div>
      </div>

      {!fileUploaded ? (
        <div className="empty-state">
          <h2>Please upload a CSV file to view your dashboard.</h2>
          <p>The CSV should contain the following columns: Date, Brand, Release, LCP, FID</p>
          {loading && <p>Loading...</p>}
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="controls">
            <div className="date-filters">
              <label htmlFor="start-date" className="date-label">
                <Calendar size={16} style={{ marginRight: '5px' }} />
                Start Date:
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <label htmlFor="end-date" className="date-label">
                <Calendar size={16} style={{ marginRight: '5px' }} />
                End Date:
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="brand-select">
                <Filter size={16} style={{ marginRight: '5px' }} />
                Filter by Brand:
              </label>
              <select
                id="brand-select"
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand === 'all' ? 'All Brands' : brand}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-container" id="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={filteredData}
                margin={{ top: 15, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="Date"
                  tickFormatter={val => new Date(val).toLocaleDateString()}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="LCP"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="LCP"
                >
                  <LabelList dataKey="Release" content={renderReleaseTag} />
                </Line>
                <Line
                  type="monotone"
                  dataKey="FID"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="FID"
                >
                  <LabelList dataKey="Release" content={renderReleaseTag} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebVitalsDashboard;
