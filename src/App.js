import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Filter, Download, Camera, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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
          dateObj: new Date(item.dateObj)
        }));
        
        dataWithDates.sort((a, b) => a.dateObj - b.dateObj);
        
        setCsvData(dataWithDates);
        setFilteredData(dataWithDates);
        setFileUploaded(true);
        
        if (savedStartDate && savedEndDate) {
          setStartDate(savedStartDate);
          setEndDate(savedEndDate);
        } else if (dataWithDates.length > 0) {
          const firstDate = dataWithDates[0].dateObj;
          const lastDate = dataWithDates[dataWithDates.length - 1].dateObj;
          const startDateStr = firstDate.toISOString().split('T')[0];
          const endDateStr = lastDate.toISOString().split('T')[0];
          setStartDate(startDateStr);
          setEndDate(endDateStr);
        }
        
        if (savedMetric) setSelectedMetric(savedMetric);
        if (savedBrand) setSelectedBrand(savedBrand);
        
        const brands = [...new Set(dataWithDates.map(item => item.BrandName).filter(Boolean))];
        if (brands.length === 1 && !savedBrand) {
          setSelectedBrand(brands[0]);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.removeItem('webVitalsData');
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (csvData.length > 0) {
      localStorage.setItem('webVitalsData', JSON.stringify(csvData));
    }
  }, [csvData]);

  useEffect(() => {
    if (startDate) localStorage.setItem('webVitalsStartDate', startDate);
  }, [startDate]);

  useEffect(() => {
    if (endDate) localStorage.setItem('webVitalsEndDate', endDate);
  }, [endDate]);

  useEffect(() => {
    localStorage.setItem('webVitalsSelectedMetric', selectedMetric);
  }, [selectedMetric]);

  useEffect(() => {
    localStorage.setItem('webVitalsSelectedBrand', selectedBrand);
  }, [selectedBrand]);

  // Clear all data
  const goBackToUpload = () => {
    setCsvData([]);
    setFilteredData([]);
    setStartDate('');
    setEndDate('');
    setSelectedMetric('both');
    setSelectedBrand('all');
    setFileUploaded(false);
    setLoading(false);
    
    localStorage.clear();
    console.log("All cached data cleared. Upload a fresh CSV file.");
  };

  // Enhanced date parsing for DD/MM/YYYY format, "DD MMM HH am/pm", and "DD-MMM-YY" formats
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // If it's already a Date object (from Excel with cellDates: true), return it
    if (dateString instanceof Date) {
      return !isNaN(dateString.getTime()) ? dateString : null;
    }

    const cleanDate = dateString.trim();

    // Month mapping
    const monthMap = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    // Handle Excel format: "19-Nov-25" (DD-MMM-YY)
    const excelFormat = /^(\d{1,2})-([a-z]{3})-(\d{2})$/i;
    let match = cleanDate.match(excelFormat);

    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].toLowerCase();
      const yearShort = parseInt(match[3]);

      const month = monthMap[monthName];
      // Convert 2-digit year to 4-digit: 25 = 2025, 26 = 2026
      const year = yearShort >= 0 && yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle CSV format: "19 Nov 12 am" (DD MMM HH am/pm)
    const csvFormat = /^(\d{1,2})\s+([a-z]{3})\s+(\d{1,2})\s+(am|pm)$/i;
    match = cleanDate.match(csvFormat);

    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].toLowerCase();
      const hour12 = parseInt(match[3]);
      const ampm = match[4].toLowerCase();

      // Determine year based on month (Nov-Dec 2025, Jan onwards 2026)
      const month = monthMap[monthName];
      const year = (month >= 10) ? 2025 : 2026;

      // Convert 12-hour to 24-hour format
      let hour24 = hour12;
      if (ampm === 'am' && hour12 === 12) hour24 = 0;
      else if (ampm === 'pm' && hour12 !== 12) hour24 = hour12 + 12;

      const date = new Date(year, month, day, hour24, 0, 0);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle DD/MM/YYYY H:mm format
    const ddmmyyyyWithTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
    match = cleanDate.match(ddmmyyyyWithTime);

    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      const hour = parseInt(match[4]);
      const minute = parseInt(match[5]);

      const date = new Date(year, month, day, hour, minute);
      if (!isNaN(date.getTime()) &&
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day) {
        return date;
      }
    }

    // Handle DD/MM/YYYY format without time
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    match = cleanDate.match(ddmmyyyy);

    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) &&
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day) {
        return date;
      }
    }

    console.warn(`Could not parse date: ${dateString}`);
    return null;
  };

  // Format date for display
  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle file upload (CSV or Excel)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv') || file.type === 'text/csv';

    if (isExcel) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' });
          parseExcelData(jsonData);
        } catch (error) {
          alert('Error reading Excel file: ' + error.message);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isCSV) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target.result;
        parseCSVData(csvContent);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
    }
  };

  // Parse CSV data with brand header support
  const parseCSVData = (csvContent) => {
    try {
      const lines = csvContent.trim().split('\n');
      
      // Look for brand name in comment header
      let brandName = null;
      const brandHeaderLine = lines.find(line => line.trim().startsWith('# Brand:'));
      if (brandHeaderLine) {
        const brandMatch = brandHeaderLine.match(/# Brand:\s*([^,]+)/);
        if (brandMatch) {
          brandName = brandMatch[1].trim();
        }
      }
      
      // Find the actual header line
      const headerLineIndex = lines.findIndex(line => 
        !line.trim().startsWith('#') && 
        (line.toLowerCase().includes('date') || line.toLowerCase().includes('largestcontentfulpaint'))
      );
      
      if (headerLineIndex === -1) {
        alert('Could not find valid header line in CSV. Expected format:\n\n# Brand: BrandName,,,\ndate,largestContentfulPaint,cumulativeLayoutShift,Release');
        setLoading(false);
        return;
      }
      
      // Parse data starting from the line after the header
      const parsedData = lines.slice(headerLineIndex + 1).map((line) => {
        if (line.trim() === '' || line.trim().startsWith('#')) return null;

        const values = line.split(',');
        const dateString = values[0]?.trim();
        const parsedDate = parseDate(dateString);

        if (!parsedDate) {
          console.warn(`Skipping row with invalid date: ${dateString}`);
          return null;
        }

        // New CSV format: date is column 0, LCP is column 10, CLS is column 12
        return {
          Date: formatDateForDisplay(parsedDate),
          OriginalDate: dateString,
          LCP: parseInt(values[10]),  // Changed from values[1] to values[10]
          CLS: parseFloat(values[12]), // Changed from values[2] to values[12]
          Release: null,  // No release column in new format
          BrandName: brandName,
          dateObj: parsedDate
        };
      }).filter(row => row && !isNaN(row.LCP) && !isNaN(row.CLS));

      if (parsedData.length === 0) {
        alert('No valid data found. Please check your CSV format.');
        setLoading(false);
        return;
      }

      parsedData.sort((a, b) => a.dateObj - b.dateObj);
      
      setCsvData(parsedData);
      setFilteredData(parsedData);
      
      const brands = [...new Set(parsedData.map(item => item.BrandName).filter(Boolean))];
      if (brands.length === 1) {
        setSelectedBrand(brands[0]);
        console.log("Auto-selecting single brand:", brands[0]);
      }
      
      if (parsedData.length > 0) {
        const firstDate = parsedData[0].dateObj;
        const lastDate = parsedData[parsedData.length - 1].dateObj;
        
        const startDateStr = firstDate.toISOString().split('T')[0];
        const endDateStr = lastDate.toISOString().split('T')[0];
        
        setStartDate(startDateStr);
        setEndDate(endDateStr);
      }
      
      setLoading(false);
      setFileUploaded(true);
      
      const dateRange = `${parsedData[0].Date} to ${parsedData[parsedData.length - 1].Date}`;
      console.log("Brand name detected:", brandName);
      
      alert(`Successfully loaded ${parsedData.length} data points!\nBrand: ${brandName || 'Not specified'}\nDisplay Date range: ${dateRange}`);
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
      setLoading(false);
    }
  };

  // Parse Excel data (from xlsx library)
  const parseExcelData = (jsonData) => {
    try {
      console.log('Excel parsing started. Total rows:', jsonData.length);
      console.log('First 3 rows:', jsonData.slice(0, 3));

      if (jsonData.length < 2) {
        alert('Excel file appears to be empty');
        setLoading(false);
        return;
      }

      // First row is header, skip it
      const dataRows = jsonData.slice(1);
      console.log('Data rows (after skipping header):', dataRows.length);

      // Get brand from first row (column 4) if it exists
      let brandName = dataRows[0]?.[4]?.trim() || null;
      console.log('Brand name:', brandName);

      const parsedData = dataRows.map((row, index) => {
        if (!row || row.length === 0) return null;

        const dateString = row[0]?.toString().trim();
        console.log(`Row ${index}: date="${dateString}", LCP="${row[1]}", CLS="${row[2]}", Release="${row[3]}"`);

        const parsedDate = parseDate(dateString);

        if (!parsedDate) {
          console.warn(`Skipping row ${index} with invalid date: ${dateString}`);
          return null;
        }

        const lcpValue = parseInt(row[1]);
        const clsValue = parseFloat(row[2]);

        console.log(`Row ${index} parsed: LCP=${lcpValue}, CLS=${clsValue}, isNaN(LCP)=${isNaN(lcpValue)}, isNaN(CLS)=${isNaN(clsValue)}`);

        return {
          Date: formatDateForDisplay(parsedDate),
          OriginalDate: dateString,
          LCP: lcpValue,
          CLS: clsValue,
          Release: row[3]?.toString().trim() || null,
          BrandName: brandName,
          dateObj: parsedDate
        };
      }).filter(row => row && !isNaN(row.LCP) && !isNaN(row.CLS));

      console.log('Parsed data count after filter:', parsedData.length);
      console.log('Sample parsed data:', parsedData.slice(0, 3));

      if (parsedData.length === 0) {
        alert('No valid data found. Please check your Excel format.');
        setLoading(false);
        return;
      }

      parsedData.sort((a, b) => a.dateObj - b.dateObj);

      setCsvData(parsedData);
      setFilteredData(parsedData);

      const brands = [...new Set(parsedData.map(item => item.BrandName).filter(Boolean))];
      if (brands.length === 1) {
        setSelectedBrand(brands[0]);
      }

      if (parsedData.length > 0) {
        const firstDate = parsedData[0].dateObj;
        const lastDate = parsedData[parsedData.length - 1].dateObj;

        const startDateStr = firstDate.toISOString().split('T')[0];
        const endDateStr = lastDate.toISOString().split('T')[0];

        setStartDate(startDateStr);
        setEndDate(endDateStr);
      }

      setLoading(false);
      setFileUploaded(true);

      const dateRange = `${parsedData[0].Date} to ${parsedData[parsedData.length - 1].Date}`;
      alert(`Successfully loaded ${parsedData.length} data points from Excel!\nBrand: ${brandName || 'Not specified'}\nDate range: ${dateRange}`);

    } catch (error) {
      console.error('Error parsing Excel:', error);
      alert('Error parsing Excel file: ' + error.message);
      setLoading(false);
    }
  };

  // Filter data based on date range and brand
  useEffect(() => {
    if (csvData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...csvData];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(item => {
        const itemDate = item.dateObj;
        return itemDate >= start && itemDate <= end;
      });
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(item => item.BrandName === selectedBrand);
    }
    
    setFilteredData(filtered);
  }, [startDate, endDate, selectedBrand, csvData]);

  // Get unique brands
  const availableBrands = useMemo(() => {
    const brands = [...new Set(csvData.map(item => item.BrandName).filter(Boolean))];
    console.log("Available brands:", brands);
    return brands.sort();
  }, [csvData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { 
        lcp: { p80: 0, min: 0, max: 0 }, 
        cls: { p80: '0.0000', min: '0.0000', max: '0.0000' },
        lastWeek: { lcpAvg: 0, clsAvg: '0.0000', dataPoints: 0 }
      };
    }
    
    const lcpValues = filteredData.map(d => d.LCP).sort((a, b) => a - b);
    const clsValues = filteredData.map(d => d.CLS).sort((a, b) => a - b);
    
    const calculatePercentile = (sortedArray, percentile) => {
      const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
      return sortedArray[Math.max(0, index)];
    };
    
    const lcpP80 = calculatePercentile(lcpValues, 80);
    const clsP80 = calculatePercentile(clsValues, 80);
    
    const sortedByDate = [...filteredData].sort((a, b) => b.dateObj - a.dateObj);
    const lastWeekData = sortedByDate.slice(0, Math.min(7, sortedByDate.length));
    
    const lastWeekLCP = lastWeekData.map(d => d.LCP);
    const lastWeekCLS = lastWeekData.map(d => d.CLS);
    
    const lastWeekLCPAvg = lastWeekData.length > 0 
      ? Math.round(lastWeekLCP.reduce((sum, val) => sum + val, 0) / lastWeekLCP.length)
      : 0;
    
    const lastWeekCLSAvg = lastWeekData.length > 0 
      ? (lastWeekCLS.reduce((sum, val) => sum + val, 0) / lastWeekCLS.length).toFixed(4)
      : '0.0000';
    
    return {
      lcp: {
        p80: Math.round(lcpP80),
        min: Math.min(...lcpValues),
        max: Math.max(...lcpValues)
      },
      cls: {
        p80: clsP80.toFixed(4),
        min: Math.min(...clsValues).toFixed(4),
        max: Math.max(...clsValues).toFixed(4)
      },
      lastWeek: {
        lcpAvg: lastWeekLCPAvg,
        clsAvg: lastWeekCLSAvg,
        dataPoints: lastWeekData.length
      }
    };
  }, [filteredData]);

  // Custom tooltip
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

  // X-axis formatting
  const getXAxisProps = (dataLength) => {
    let interval = 0;
    
    if (dataLength > 60) {
      interval = Math.ceil(dataLength / 15);
    } else if (dataLength > 30) {
      interval = Math.ceil(dataLength / 10);
    } else if (dataLength > 15) {
      interval = 1;
    }
    
    return {
      interval,
      angle: dataLength > 20 ? -45 : -30,
      height: dataLength > 20 ? 80 : 60
    };
  };

  const xAxisProps = getXAxisProps(filteredData.length);

  // Calculate dynamic top margin based on number of releases
  const releases = filteredData.filter(d => d.Release).length;
  const staggerLevels = releases <= 10 ? 5 : releases <= 20 ? 8 : releases <= 30 ? 10 : 12;
  const topMargin = Math.max(80, 40 + (staggerLevels * 15) + 30); // baseOffset + (levels * spacing) + padding

  // Release marker component
	const ReleaseMarker = (props) => {
	  const { cx, cy, payload, index } = props;
	  if (payload && payload.Release) {
		// Count total releases and use more stagger levels to prevent overlap
		const releases = filteredData.filter(d => d.Release).length;
		const staggerLevels = releases <= 10 ? 5 : releases <= 20 ? 8 : releases <= 30 ? 10 : 12;

		const baseOffset = 40; // Increased base offset
		const labelOffset = baseOffset + (index % staggerLevels) * 15; // Dynamic stagger levels
		const yPosition = cy - labelOffset;
		
		return (
		  <g>
			<line
			  x1={cx}
			  y1={cy}
			  x2={cx}
			  y2={yPosition + 6}
			  stroke="#d97706"
			  strokeWidth={1}
			  strokeDasharray="2,2"
			/>
			<circle 
			  cx={cx} 
			  cy={cy} 
			  r={5}
			  fill="#f59e0b" 
			  stroke="#d97706" 
			  strokeWidth={2}
			/>
			<rect
			  x={cx - 22}
			  y={yPosition - 6}
			  width={44}
			  height={12}
			  fill="white"
			  stroke="#d97706"
			  strokeWidth={1}
			  rx={2}
			  opacity={0.95}
			/>
			<text 
			  x={cx} 
			  y={yPosition} 
			  textAnchor="middle" 
			  fill="#d97706" 
			  fontSize="8"
			  fontWeight="bold"
			  dominantBaseline="middle"
			>
			  {payload.Release}
			</text>
		  </g>
		);
	  }
	  return <circle cx={cx} cy={cy} r={3} fill={props.fill} stroke={props.stroke} strokeWidth={2} />;
	};

  // Export data
  const exportFilteredData = () => {
    const csvContent = [
      'Date,LCP,CLS,Release,BrandName',
      ...filteredData.map(row => `${row.Date},${row.LCP},${row.CLS},${row.Release || ''},${row.BrandName || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-filtered-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export chart
  const exportChart = async (chartType) => {
    try {
      const chartContainer = document.getElementById(`${chartType}-chart-container`);
      if (!chartContainer) {
        alert('Chart not found. Please try again.');
        return;
      }

      const tooltips = document.querySelectorAll('.recharts-tooltip-wrapper');
      tooltips.forEach(tooltip => tooltip.style.display = 'none');

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(chartContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chartType.toUpperCase()}-chart-${startDate}-to-${endDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Chart exported as PNG successfully!');
      }, 'image/png', 1.0);

      tooltips.forEach(tooltip => tooltip.style.display = '');

    } catch (error) {
      console.error('Error exporting chart:', error);
      alert(`Error exporting chart: ${error.message}`);
    }
  };

  if (!fileUploaded) {
    return (
      <div className="loading">
        <div className="upload-section">
          <h1>Web Vitals Dashboard</h1>
          <p>Upload your CSV or Excel file to start analyzing Web Vitals data</p>
          <div className="upload-area">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{
                display: 'block',
                width: '100%',
                margin: '16px auto',
                padding: '8px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              CSV format: <br/>
              <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                # Brand: BrandName,,,<br/>
                date,largestContentfulPaint,cumulativeLayoutShift,Release
              </code><br/>
              <strong>Expected date format:</strong> DD/MM/YYYY H:mm (e.g., 12/08/2025 0:00 = August 12th)<br/>
              <em>Time portion will be stripped from graph display</em>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading Web Vitals data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Web Vitals Dashboard</h1>
        <p>Monitor LCP and CLS performance metrics over time</p>
        {availableBrands.length > 0 && (
          <div style={{ 
            marginTop: '20px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {availableBrands.map(brand => (
              <div key={brand} style={{ 
                background: selectedBrand === brand ? '#dbeafe' : '#f3f4f6', 
                color: selectedBrand === brand ? '#1e40af' : '#6b7280', 
                padding: '12px 24px', 
                borderRadius: '24px', 
                fontSize: '18px',
                fontWeight: '600',
                border: selectedBrand === brand ? '3px solid #3b82f6' : '2px solid #d1d5db',
                minWidth: '120px',
                textAlign: 'center',
                boxShadow: selectedBrand === brand ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                letterSpacing: '0.5px'
              }}>
                {brand}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="controls">
        <div className="controls-grid">
          <div className="control-group">
            <button
              onClick={goBackToUpload}
              className="btn btn-secondary"
              title="Clear cache and upload new CSV file"
            >
              <ArrowLeft size={16} />
              Clear Cache & New Upload
            </button>
          </div>

          <div className="control-group">
            <Calendar size={20} color="#6b7280" />
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                if (endDate && newStartDate > endDate) {
                  alert('Start date cannot be later than end date');
                  return;
                }
                setStartDate(newStartDate);
              }}
            />
          </div>
          
          <div className="control-group">
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const newEndDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                
                if (newEndDate > today) {
                  alert('End date cannot be in the future');
                  return;
                }
                
                if (startDate && newEndDate < startDate) {
                  alert('End date cannot be earlier than start date');
                  return;
                }
                setEndDate(newEndDate);
              }}
            />
          </div>

          <div className="control-group">
            <Filter size={20} color="#6b7280" />
            <label>Brand:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="all">All Brands</option>
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <Filter size={20} color="#6b7280" />
            <label>View:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="both">Both Metrics</option>
              <option value="lcp">LCP Only</option>
              <option value="cls">CLS Only</option>
            </select>
          </div>

          <button
            onClick={exportFilteredData}
            className="btn btn-primary"
          >
            <Download size={16} />
            Export Data
          </button>

          <button
            onClick={() => exportChart('lcp')}
            className="btn btn-success"
            disabled={selectedMetric === 'cls'}
          >
            <Camera size={16} />
            Export LCP Chart
          </button>

          <button
            onClick={() => exportChart('cls')}
            className="btn btn-purple"
            disabled={selectedMetric === 'lcp'}
          >
            <Camera size={16} />
            Export CLS Chart
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Aggregated Daily 80th percentile-(LCP)</h3>
          <div className="value">{stats.lcp.p80}ms</div>
          <div className="range">Range: {stats.lcp.min}ms - {stats.lcp.max}ms</div>
        </div>

        <div className="stat-card">
          <h3>Aggregated Daily 80th percentile-(CLS)</h3>
          <div className="value">{stats.cls.p80}</div>
          <div className="range">Range: {stats.cls.min} - {stats.cls.max}</div>
        </div>

        <div className="stat-card">
          <h3>Data Points</h3>
          <div className="value">{filteredData.length}</div>
          <div className="range">Filtered dataset</div>
        </div>

        <div className="stat-card">
          <h3>Brand Information</h3>
          <div className="value">
            {selectedBrand === 'all' ? availableBrands.length : 1}
          </div>
          <div className="range">
            {selectedBrand === 'all' 
              ? `${availableBrands.length} brand${availableBrands.length !== 1 ? 's' : ''} total`
              : `Selected: ${selectedBrand}`
            }
          </div>
        </div>

        <div className="stat-card">
          <h3>Average LCP for last one week data points</h3>
          <div className="value">{stats.lastWeek.lcpAvg}ms</div>
          <div className="range">Based on {stats.lastWeek.dataPoints} recent points</div>
        </div>

        <div className="stat-card">
          <h3>Average CLS for last one week data points</h3>
          <div className="value">{stats.lastWeek.clsAvg}</div>
          <div className="range">Based on {stats.lastWeek.dataPoints} recent points</div>
        </div>
      </div>

      {(selectedMetric === 'both' || selectedMetric === 'lcp') && (
        <div className="chart-container" id="lcp-chart-container">
          <h2>
            <span className="release-indicator"></span>
            Largest Contentful Paint (LCP)
          </h2>
          <div className="chart-wrapper" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
               data={filteredData} 
               margin={{ top: topMargin, right: 30, left: 20, bottom: xAxisProps.height + 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Date" 
                  tick={{ fontSize: 11 }}
                  angle={xAxisProps.angle}
                  textAnchor="end"
                  height={xAxisProps.height}
                  interval={xAxisProps.interval}
                  minTickGap={5}
                />
                <YAxis 
                  label={{ value: 'LCP (ms)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="LCP" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={<ReleaseMarker fill="#2563eb" stroke="#1d4ed8" />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Overlay Releases Section pushed higher */}
            <div style={{ 
              position: 'absolute',
              bottom: '80px',
              left: '80px',
              right: '60px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              <h4 style={{ 
                color: '#374151',
                fontSize: '0.7rem',
                fontWeight: '600',
                marginBottom: '6px', 
                marginTop: '0px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                position: 'sticky',
                top: '0px',
                background: 'rgba(255, 255, 255, 0.95)',
                zIndex: 1
              }}>Releases in this period</h4>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'flex-start'
              }}>
                {filteredData
                  .filter(item => item.Release)
                  .map((item, index) => (
                    <div key={index} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      padding: '2px 4px',
                      fontSize: '0.6rem',
                      whiteSpace: 'nowrap',
                      marginBottom: '2px'
                    }}>
                      <span style={{ color: '#475569', fontWeight: '500', marginRight: '3px' }}>
                        {item.Date}
                      </span>
                      <span style={{ 
                        color: '#1e40af',
                        fontWeight: '600',
                        background: '#dbeafe',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontSize: '0.55rem'
                      }}>
                        {item.Release}
                      </span>
                    </div>
                  ))
                }
                {filteredData.filter(item => item.Release).length === 0 && (
                  <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.65rem' }}>
                    No releases in the selected date range
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(selectedMetric === 'both' || selectedMetric === 'cls') && (
        <div className="chart-container" id="cls-chart-container">
          <h2>
            <span className="release-indicator"></span>
            Cumulative Layout Shift (CLS)
          </h2>
          <div className="chart-wrapper" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
               data={filteredData} 
               margin={{ top: topMargin, right: 30, left: 20, bottom: xAxisProps.height + 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Date" 
                  tick={{ fontSize: 11 }}
                  angle={xAxisProps.angle}
                  textAnchor="end"
                  height={xAxisProps.height}
                  interval={xAxisProps.interval}
                  minTickGap={5}
                />
                <YAxis 
                  label={{ value: 'CLS', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="CLS" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={<ReleaseMarker fill="#dc2626" stroke="#b91c1c" />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Overlay Releases Section pushed higher */}
            <div style={{ 
              position: 'absolute',
              bottom: '80px',
              left: '60px',
              right: '60px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              <h4 style={{ 
                color: '#374151',
                fontSize: '0.7rem',
                fontWeight: '600',
                marginBottom: '6px', 
                marginTop: '0px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                position: 'sticky',
                top: '0px',
                background: 'rgba(255, 255, 255, 0.95)',
                zIndex: 1
              }}>Releases in this period</h4>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'flex-start'
              }}>
                {filteredData
                  .filter(item => item.Release)
                  .map((item, index) => (
                    <div key={index} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      padding: '2px 4px',
                      fontSize: '0.6rem',
                      whiteSpace: 'nowrap',
                      marginBottom: '2px'
                    }}>
                      <span style={{ color: '#475569', fontWeight: '500', marginRight: '3px' }}>
                        {item.Date}
                      </span>
                      <span style={{ 
                        color: '#1e40af',
                        fontWeight: '600',
                        background: '#dbeafe',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontSize: '0.55rem'
                      }}>
                        {item.Release}
                      </span>
                    </div>
                  ))
                }
                {filteredData.filter(item => item.Release).length === 0 && (
                  <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.65rem' }}>
                    No releases in the selected date range
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="release-timeline" style={{ display: 'none' }}>
        <h2>Release Timeline</h2>
        <div className="release-tags">
          {filteredData
            .filter(item => item.Release)
            .map((item, index) => (
              <div key={index} className="release-tag">
                {item.Date}: {item.Release}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default WebVitalsDashboard;
