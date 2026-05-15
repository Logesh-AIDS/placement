// Tests Service Layer
// Routes between mock and real test data based on environment flag

import { testsApi } from '../api';
import { mockTestsService } from './mock/mockTests';
import { USE_MOCK_DATA, logDataSource } from './index';

export const testsService = {
  // Get all tests
  async getAll(token: string, domain?: string) {
    logDataSource('TestsService', 'getAll');
    
    if (USE_MOCK_DATA) {
      if (domain) {
        return mockTestsService.getByDomain(domain as 'Web' | 'ML' | 'DSA');
      }
      return mockTestsService.getAll();
    } else {
      return testsApi.getAll(token, domain);
    }
  },

  // Get test by ID
  async getById(token: string, id: number) {
    logDataSource('TestsService', 'getById');
    
    if (USE_MOCK_DATA) {
      return mockTestsService.getById(id);
    } else {
      return testsApi.getById(token, id);
    }
  },

  // Create new test (admin only)
  async create(token: string, testData: {
    name: string;
    domain: 'Web' | 'ML' | 'DSA';
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      domain: string;
    }>;
    timeLimit?: number;
    passingScore?: number;
  }) {
    logDataSource('TestsService', 'create');
    
    if (USE_MOCK_DATA) {
      // Transform the data to match mock service format
      const mockTestData = {
        name: testData.name,
        domain: testData.domain,
        questions: testData.questions.map((q, index) => ({
          id: `temp_${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          domain: testData.domain
        })),
        timeLimit: testData.timeLimit,
        passingScore: testData.passingScore
      };
      
      return mockTestsService.create(mockTestData);
    } else {
      // Real API call would go here when test creation endpoint is implemented
      // For now, we'll simulate the real API structure
      throw new Error('Real test creation API not implemented yet. Please use mock mode.');
    }
  },

  // Update test
  async update(token: string, id: number, testData: any) {
    logDataSource('TestsService', 'update');
    
    if (USE_MOCK_DATA) {
      return mockTestsService.update(id, testData);
    } else {
      throw new Error('Real test update API not implemented yet. Please use mock mode.');
    }
  },

  // Delete test
  async delete(token: string, id: number) {
    logDataSource('TestsService', 'delete');
    
    if (USE_MOCK_DATA) {
      return mockTestsService.delete(id);
    } else {
      throw new Error('Real test delete API not implemented yet. Please use mock mode.');
    }
  },

  // Start test attempt (uses real API even in mock mode for consistency)
  async startAttempt(token: string, testId: number) {
    logDataSource('TestsService', 'startAttempt');
    
    if (USE_MOCK_DATA) {
      // In mock mode, we still want to use real test attempts if backend is available
      // This allows testing the full flow even with mock test data
      try {
        return testsApi.startAttempt(token, testId);
      } catch (error) {
        // Fallback to mock behavior if real API is not available
        console.warn('Real API not available, using mock test attempt');
        return {
          success: true,
          data: { id: Date.now() }
        };
      }
    } else {
      return testsApi.startAttempt(token, testId);
    }
  },

  // Submit test attempt (uses real API even in mock mode for consistency)
  async submitAttempt(token: string, attemptId: number, answers: Record<number, string>) {
    logDataSource('TestsService', 'submitAttempt');
    
    if (USE_MOCK_DATA) {
      try {
        return testsApi.submitAttempt(token, attemptId, answers);
      } catch (error) {
        // Fallback to mock behavior
        console.warn('Real API not available, using mock test submission');
        return {
          success: true,
          data: {
            id: attemptId,
            score: Math.floor(Math.random() * 100),
            total_marks: 100,
            percentage: Math.floor(Math.random() * 100),
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        };
      }
    } else {
      return testsApi.submitAttempt(token, attemptId, answers);
    }
  },

  // Get user's test attempts
  async getMyAttempts(token: string) {
    logDataSource('TestsService', 'getMyAttempts');
    
    if (USE_MOCK_DATA) {
      try {
        return testsApi.getMyAttempts(token);
      } catch (error) {
        // Fallback to mock data
        return {
          success: true,
          data: []
        };
      }
    } else {
      return testsApi.getMyAttempts(token);
    }
  }
};