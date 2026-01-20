# Web Vitals Dashboard

A React-based dashboard for tracking and visualizing web performance metrics, specifically **Largest Contentful Paint (LCP)** and **Cumulative Layout Shift (CLS)**.

## Features

- **CSV Data Import**: Upload performance metrics in CSV format
- **Interactive Visualizations**: Dual-axis line charts for LCP and CLS over time
- **Statistical Analysis**: 80th percentile calculations, min/max ranges, last week averages
- **Release Tracking**: Visual markers for release deployments
- **Brand Filtering**: Support for multi-brand data tracking
- **Date Range Filtering**: Filter data by custom date ranges
- **Data Export**: Export filtered data as CSV or charts as PNG images
- **Data Persistence**: LocalStorage caching with quota management
- **Error Handling**: Robust error boundaries and input validation

## CSV Format

The dashboard expects CSV files in the following format:

```csv
# Brand: BrandName,,,
date,largestContentfulPaint,cumulativeLayoutShift,Release
01/01/2024,2500,0.05,v1.0.0
02/01/2024,2400,0.04,
```

**Format Details:**
- **Optional Brand Header**: First line starting with `# Brand:` to specify brand name
- **Date Format**: DD/MM/YYYY or DD/MM/YYYY H:mm
- **LCP**: Largest Contentful Paint in milliseconds (integer)
- **CLS**: Cumulative Layout Shift (decimal, e.g., 0.05)
- **Release**: Optional release version

## Performance Thresholds

### LCP (Largest Contentful Paint)
- **Good**: ≤ 2500ms (green) | **Needs Improvement**: 2501-4000ms (yellow) | **Poor**: > 4000ms (red)

### CLS (Cumulative Layout Shift)
- **Good**: ≤ 0.1 (green) | **Needs Improvement**: 0.1-0.25 (yellow) | **Poor**: > 0.25 (red)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run deploy`

Deploys the app to GitHub Pages.

## Technologies Used

- **React 18** - UI framework
- **Recharts 3.1.2** - Charting library
- **html2canvas 1.4.1** - Chart export to PNG
- **Lucide React** - Icon library
- **Web Vitals** - Performance monitoring

## Project Structure

```
web_vitals/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── App.js          # Main application
│   └── index.js        # Entry point
└── package.json
```

## Deployment

Hosted on **Netlify**: https://ornate-monstera-92b235.netlify.app

## Recent Improvements

- ✅ Upgraded to React 18
- ✅ Added ErrorBoundary for error handling
- ✅ Implemented localStorage quota management
- ✅ Created modular utility functions
- ✅ Added CSV injection protection
- ✅ Updated PWA branding
