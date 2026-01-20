import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Web Vitals Dashboard', () => {
  render(<App />);
  const heading = screen.getByText(/Web Vitals Dashboard/i);
  expect(heading).toBeInTheDocument();
});

test('renders file upload section when no data', () => {
  localStorage.clear();
  render(<App />);
  const uploadText = screen.getByText(/upload your csv file to start analyzing/i);
  expect(uploadText).toBeInTheDocument();
});
