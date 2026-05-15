// Service Layer - Central export point
// This layer provides a toggle between mock and real data

export { jobsService } from './jobsService';
export { usersService } from './usersService';
export { testsService } from './testsService';
export { applicationsService } from './applicationsService';

// Environment flag for toggling data sources
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Helper function to log data source being used
export const logDataSource = (serviceName: string, operation: string) => {
  const source = USE_MOCK_DATA ? 'MOCK' : 'REAL';
  const emoji = USE_MOCK_DATA ? '🎭' : '🔗';
  console.log(`${emoji} ${serviceName}: ${operation} using ${source} data`);
};

// Helper to show current mode in UI (for development)
export const getDataModeInfo = () => ({
  isMockMode: USE_MOCK_DATA,
  mode: USE_MOCK_DATA ? 'Mock Data' : 'Real API',
  emoji: USE_MOCK_DATA ? '🎭' : '🔗',
  description: USE_MOCK_DATA 
    ? 'Using mock data for development/demo' 
    : 'Connected to live backend API'
});