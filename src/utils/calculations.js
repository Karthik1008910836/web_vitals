// Calculate percentile value from sorted array
export const calculatePercentile = (sortedArray, percentile) => {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
};

// Calculate statistics for LCP and CLS
export const calculateStats = (filteredData) => {
  if (filteredData.length === 0) {
    return {
      lcp: { p80: 0, min: 0, max: 0 },
      cls: { p80: '0.0000', min: '0.0000', max: '0.0000' },
      lastWeek: { lcpAvg: 0, clsAvg: '0.0000', dataPoints: 0 }
    };
  }

  const lcpValues = filteredData.map(d => d.LCP).sort((a, b) => a - b);
  const clsValues = filteredData.map(d => d.CLS).sort((a, b) => a - b);

  const lcpP80 = calculatePercentile(lcpValues, 80);
  const clsP80 = calculatePercentile(clsValues, 80);

  // Get last week data (most recent 7 data points)
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
};

// Filter data based on date range and brand
export const filterData = (csvData, startDate, endDate, selectedBrand) => {
  if (csvData.length === 0) return [];

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

  return filtered;
};

// Get unique brands from data
export const getUniqueBrands = (csvData) => {
  const brands = [...new Set(csvData.map(item => item.BrandName).filter(Boolean))];
  return brands.sort();
};

// Calculate X-axis properties based on data length
export const getXAxisProps = (dataLength) => {
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
