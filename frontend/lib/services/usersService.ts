// Users Service Layer
// Routes between mock and real user data based on environment flag

import { mockUsersService } from './mock/mockUsers';
import { USE_MOCK_DATA, logDataSource } from './index';

// Note: Real users API endpoints would be imported here when implemented
// import { usersApi } from '../api';

export const usersService = {
  // Get all users (admin only)
  async getAll(token: string) {
    logDataSource('UsersService', 'getAll');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getAll();
    } else {
      // Real API call would go here when users endpoints are implemented
      // For now, we'll simulate the real API structure
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  },

  // Get user by ID
  async getById(token: string, id: number) {
    logDataSource('UsersService', 'getById');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getById(id);
    } else {
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  },

  // Update user
  async update(token: string, id: number, userData: any) {
    logDataSource('UsersService', 'update');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.update(id, userData);
    } else {
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  },

  // Delete/deactivate user
  async delete(token: string, id: number) {
    logDataSource('UsersService', 'delete');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.delete(id);
    } else {
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  },

  // Get users by role
  async getByRole(token: string, role: 'student' | 'hr' | 'admin') {
    logDataSource('UsersService', 'getByRole');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getByRole(role);
    } else {
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  },

  // Search users
  async search(token: string, query: string) {
    logDataSource('UsersService', 'search');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.search(query);
    } else {
      throw new Error('Real users API not implemented yet. Please use mock mode.');
    }
  }
};