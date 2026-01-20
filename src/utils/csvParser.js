// Enhanced date parsing for DD/MM/YYYY format
export const parseDate = (dateString) => {
  if (!dateString) return null;

  const cleanDate = dateString.trim();

  // Handle DD/MM/YYYY H:mm format
  const ddmmyyyyWithTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
  let match = cleanDate.match(ddmmyyyyWithTime);

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
      console.log(`Parsed ${cleanDate} as DD/MM/YYYY: Day=${day}, Month=${month + 1} (${date.toLocaleDateString('en-US', { month: 'long' })}), Year=${year}`);
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
      console.log(`Parsed ${cleanDate} as DD/MM/YYYY: Day=${day}, Month=${month + 1} (${date.toLocaleDateString('en-US', { month: 'long' })}), Year=${year}`);
      return date;
    }
  }

  console.warn(`Could not parse date: ${dateString}`);
  return null;
};

// Format date for display
export const formatDateForDisplay = (dateObj) => {
  if (!dateObj) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

// Sanitize CSV input to prevent injection
const sanitizeCSVValue = (value) => {
  if (!value) return value;
  const str = String(value).trim();
  // Remove potential formula injections
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return "'" + str;
  }
  return str;
};

// Parse CSV data with brand header support
export const parseCSVData = (csvContent) => {
  const lines = csvContent.trim().split('\n');

  // Look for brand name in comment header
  let brandName = null;
  const brandHeaderLine = lines.find(line => line.trim().startsWith('# Brand:'));
  if (brandHeaderLine) {
    const brandMatch = brandHeaderLine.match(/# Brand:\s*([^,]+)/);
    if (brandMatch) {
      brandName = sanitizeCSVValue(brandMatch[1].trim());
    }
  }

  // Find the actual header line
  const headerLineIndex = lines.findIndex(line =>
    !line.trim().startsWith('#') &&
    (line.toLowerCase().includes('date') || line.toLowerCase().includes('largestcontentfulpaint'))
  );

  if (headerLineIndex === -1) {
    throw new Error('Could not find valid header line in CSV. Expected format:\n\n# Brand: BrandName,,,\ndate,largestContentfulPaint,cumulativeLayoutShift,Release');
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

    const lcp = parseInt(values[1]);
    const cls = parseFloat(values[2]);

    // Validate numeric values
    if (isNaN(lcp) || isNaN(cls)) {
      console.warn(`Skipping row with invalid metrics: LCP=${values[1]}, CLS=${values[2]}`);
      return null;
    }

    return {
      Date: formatDateForDisplay(parsedDate),
      OriginalDate: dateString,
      LCP: lcp,
      CLS: cls,
      Release: sanitizeCSVValue(values[3]?.trim()) || null,
      BrandName: brandName,
      dateObj: parsedDate
    };
  }).filter(row => row !== null);

  if (parsedData.length === 0) {
    throw new Error('No valid data found. Please check your CSV format.');
  }

  // Sort by date
  parsedData.sort((a, b) => a.dateObj - b.dateObj);

  return { data: parsedData, brandName };
};
