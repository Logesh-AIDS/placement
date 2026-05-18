// Users Service Layer
// Routes between mock and real user data based on environment flag

import { mockUsersService } from './mock/mockUsers';
import { USE_MOCK_DATA, logDataSource } from './index';
import { usersApi } from '../api';

export const usersService = {
  // Get all users (admin only)
  async getAll(token: string, filters?: { role?: string; domain?: string; status?: string; page?: number; limit?: number }) {
    logDataSource('UsersService', 'getAll');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getAll();
    } else {
      // Real API call
      return usersApi.getAll(token, filters);
    }
  },

  // Get user by ID
  async getById(token: string, id: number) {
    logDataSource('UsersService', 'getById');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getById(id);
    } else {
      return usersApi.getById(token, id);
    }
  },

  // Update user
  async update(token: string, id: number, userData: any) {
    logDataSource('UsersService', 'update');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.update(id, userData);
    } else {
      return usersApi.update(token, id, userData);
    }
  },

  // Delete/deactivate user
  async delete(token: string, id: number) {
    logDataSource('UsersService', 'delete');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.delete(id);
    } else {
      return usersApi.delete(token, id);
    }
  },

  // Get users by role
  async getByRole(token: string, role: 'student' | 'hr' | 'admin') {
    logDataSource('UsersService', 'getByRole');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.getByRole(role);
    } else {
      return usersApi.getAll(token, { role });
    }
  },

  // Search users
  async search(token: string, query: string) {
    logDataSource('UsersService', 'search');
    
    if (USE_MOCK_DATA) {
      return mockUsersService.search(query);
    } else {
      // For real API, we'll fetch all and filter client-side
      // In production, you'd want a server-side search endpoint
      const response = await usersApi.getAll(token);
      const filtered = response.data.filter((user: any) => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      return { ...response, data: filtered };
    }
  }
};