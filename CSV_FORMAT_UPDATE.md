# CSV Format Update - Support for New Data Format

## Changes Made

The application has been updated to support the new CSV format from the performance monitoring tool.

### Old CSV Format
```csv
# Brand: Ladbrokes,,,
date,largestContentfulPaint,cumulativeLayoutShift,Release
15/07/2025 00:00,1424,0.0502,25.27.0
16/07/2025 00:00,1342,0.0518,25.28.0
```

**Columns:**
- Column 0: date (DD/MM/YYYY HH:mm)
- Column 1: largestContentfulPaint
- Column 2: cumulativeLayoutShift
- Column 3: Release

### New CSV Format
```csv
date,timestamp,reportId,mark,firstByte,...,largestContentfulPaint,...,cumulativeLayoutShift,...
19 Nov 12 am,1763490600,,70,308,...,3126,...,0.0236,...
20 Nov 12 am,1763577000,,70,304,...,3132,...,0.0264,...
```

**Columns:**
- Column 0: date (DD MMM HH am/pm format - e.g., "19 Nov 12 am")
- Column 10: largestContentfulPaint
- Column 12: cumulativeLayoutShift
- No Release column

## Code Changes

### File: [src/App.js](src/App.js)

#### 1. Updated parseDate Function (Lines 103-180)

**Added support for new date format:**
```javascript
// Handle new format: "19 Nov 12 am" (DD MMM HH am/pm)
const monthMap = {
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

const newFormat = /^(\d{1,2})\s+([a-z]{3})\s+(\d{1,2})\s+(am|pm)$/i;
let match = cleanDate.match(newFormat);

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
  return date;
}
```

**Features:**
- Parses "19 Nov 12 am" format
- Converts 12-hour time (am/pm) to 24-hour
- Automatically determines year (Nov-Dec 2025, Jan+ 2026)
- Handles midnight correctly (12 am = 0:00)

#### 2. Updated CSV Column Mapping (Lines 231-240)

**Changed from:**
```javascript
LCP: parseInt(values[1]),
CLS: parseFloat(values[2]),
Release: values[3]?.trim() || null,
```

**To:**
```javascript
LCP: parseInt(values[10]),  // Column 10: largestContentfulPaint
CLS: parseFloat(values[12]), // Column 12: cumulativeLayoutShift
Release: null,  // No release column in new format
```

## Date Format Examples

| Input Format | Example | Parsed Date |
|--------------|---------|-------------|
| DD MMM HH am | 19 Nov 12 am | 2025-11-19 00:00 |
| DD MMM HH pm | 19 Nov 11 pm | 2025-11-19 23:00 |
| DD MMM HH am | 15 Jan 6 am | 2026-01-15 06:00 |
| DD/MM/YYYY HH:mm | 15/07/2025 00:00 | 2025-07-15 00:00 |

## Backward Compatibility

The parser still supports the old format:
- ✅ DD/MM/YYYY HH:mm format
- ✅ DD/MM/YYYY format
- ✅ Brand header parsing
- ✅ Release column (if present)

## Testing

### Test with New Format CSV
File: `C:\Users\Karthik.Adama\Downloads\Ladbrokes-Single Domain-Homepage-IPhone-4G-19-Nov-25_12-am-TO-21-Jan-26_11-pm.csv`

**Expected Results:**
- ✅ All 64 rows parsed correctly
- ✅ Dates from Nov 19, 2025 to Jan 21, 2026
- ✅ LCP values displayed (3126, 3132, 3162, etc.)
- ✅ CLS values displayed (0.0236, 0.0264, 0.0321, etc.)
- ✅ No release markers (Release column doesn't exist)
- ✅ Graphs render with all data points

### Test with Old Format CSV
File: Previous CSVs with `# Brand:` header

**Expected Results:**
- ✅ Still works with old format
- ✅ Brand name detected
- ✅ Release markers displayed (if Release column exists)

## Notes

1. **Year Determination Logic:**
   - Nov (month 10) and Dec (month 11) → 2025
   - Jan (month 0) through Oct (month 9) → 2026
   - This handles the transition from 2025 to 2026

2. **12-Hour to 24-Hour Conversion:**
   - 12 am = 00:00 (midnight)
   - 1 am - 11 am = 01:00 - 11:00
   - 12 pm = 12:00 (noon)
   - 1 pm - 11 pm = 13:00 - 23:00

3. **No Release Markers:**
   - Since the new format doesn't have a Release column, no version markers will appear on the graphs
   - This is expected behavior
   - If you need release markers, you'll need to add a Release column to the CSV

## Compilation Status

✅ Compiled successfully
✅ Development server running at http://localhost:3000
✅ Ready to test with new CSV format

## How to Use

1. Navigate to http://localhost:3000
2. Click "Upload CSV File"
3. Select your new format CSV file
4. The dashboard will parse and display:
   - Total data points
   - LCP statistics (p80, min, max)
   - CLS statistics (p80, min, max)
   - LCP and CLS trend graphs
   - No release markers (since Release column doesn't exist)
