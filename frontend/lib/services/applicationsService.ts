// Applications Service Layer
// Routes between mock and real application data based on environment flag

import { applicationsApi } from '../api';
import { USE_MOCK_DATA, logDataSource } from './index';

// Mock applications data (simple for now since applications are mostly working with real API)
const mockApplicationsData = [
  {
    id: 1,
    student_id: 1,
    job_id: 1,
    status: 'applied' as const,
    cover_letter: 'I am very interested in this position...',
    applied_at: '2024-04-10T10:00:00Z',
    updated_at: '2024-04-10T10:00:00Z',
    job_title: 'Frontend Developer',
    job_role: 'Developer',
    domain: 'Web',
    location: 'Remote'
  },
  {
    id: 2,
    student_id: 1,
    job_id: 2,
    status: 'shortlisted' as const,
    cover_letter: 'My experience in backend development...',
    applied_at: '2024-04-08T14:30:00Z',
    updated_at: '2024-04-12T09:15:00Z',
    job_title: 'Backend Developer',
    job_role: 'Developer',
    domain: 'Web',
    location: 'San Francisco, CA'
  }
];

export const applicationsService = {
  // Apply for a job
  async apply(token: string, jobId: number, coverLetter?: string) {
    logDataSource('ApplicationsService', 'apply');
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newApplication = {
        id: Date.now(),
        student_id: 1, // Mock current user ID
        job_id: jobId,
        status: 'applied' as const,
        cover_letter: coverLetter || null,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newApplication,
        message: 'Application submitted successfully'
      };
    } else {
      return applicationsApi.apply(token, jobId, coverLetter);
    }
  },

  // Get current user's applications
  async getMy(token: string) {
    logDataSource('ApplicationsService', 'getMy');
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: mockApplicationsData
      };
    } else {
      return applicationsApi.getMy(token);
    }
  },

  // Get applications for a specific job (HR view)
  async getForJob(token: string, jobId: number) {
    logDataSource('ApplicationsService', 'getForJob');
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter applications for the specific job
      const jobApplications = mockApplicationsData.filter(app => app.job_id === jobId);
      
      return {
        success: true,
        data: jobApplications
      };
    } else {
      // Real API endpoint would be implemented here
      throw new Error('Get applications for job not implemented in real API yet. Please use mock mode.');
    }
  },

  // Update application status (HR only)
  async updateStatus(token: string, applicationId: number, status: 'applied' | 'shortlisted' | 'rejected') {
    logDataSource('ApplicationsService', 'updateStatus');
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const application = mockApplicationsData.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }
      
      application.status = status;
      application.updated_at = new Date().toISOString();
      
      return {
        success: true,
        data: application,
        message: 'Application status updated successfully'
      };
    } else {
      // Real API endpoint would be implemented here
      throw new Error('Update application status not implemented in real API yet. Please use mock mode.');
    }
  }
};