// Jobs Service Layer
// Routes between mock and real job data based on environment flag

import { jobsApi } from '../api';
import { mockJobsService } from './mock/mockJobs';
import { USE_MOCK_DATA, logDataSource } from './index';

export const jobsService = {
  // Get all jobs (for students browsing)
  async getAll(token: string, domain?: string, page = 1) {
    logDataSource('JobsService', 'getAll');
    
    if (USE_MOCK_DATA) {
      const mockResponse = await mockJobsService.getAll();
      // Filter by domain if specified
      if (domain && domain !== 'all') {
        mockResponse.data = mockResponse.data.filter(job => job.domain === domain);
      }
      // Add pagination structure to match real API
      return {
        ...mockResponse,
        pagination: {
          total: mockResponse.data.length,
          page,
          limit: 20
        }
      };
    } else {
      return jobsApi.getAll(token, domain, page);
    }
  },

  // Get single job by ID
  async getById(token: string, id: number) {
    logDataSource('JobsService', 'getById');
    
    if (USE_MOCK_DATA) {
      return mockJobsService.getById(id);
    } else {
      return jobsApi.getById(token, id);
    }
  },

  // Create new job (HR only)
  async create(token: string, payload: any) {
    logDataSource('JobsService', 'create');
    
    if (USE_MOCK_DATA) {
      return mockJobsService.create(payload);
    } else {
      return jobsApi.create(token, payload);
    }
  },

  // Get jobs posted by current HR user
  async getMyJobs(token: string) {
    logDataSource('JobsService', 'getMyJobs');
    
    if (USE_MOCK_DATA) {
      return mockJobsService.getMyJobs();
    } else {
      return jobsApi.getMyJobs(token);
    }
  },

  // Update job (mock only for now)
  async update(token: string, id: number, payload: any) {
    logDataSource('JobsService', 'update');
    
    if (USE_MOCK_DATA) {
      return mockJobsService.update(id, payload);
    } else {
      // Real API update endpoint would go here when implemented
      throw new Error('Job update not implemented in real API yet');
    }
  },

  // Delete job (mock only for now)
  async delete(token: string, id: number) {
    logDataSource('JobsService', 'delete');
    
    if (USE_MOCK_DATA) {
      return mockJobsService.delete(id);
    } else {
      // Real API delete endpoint would go here when implemented
      throw new Error('Job delete not implemented in real API yet');
    }
  }
};