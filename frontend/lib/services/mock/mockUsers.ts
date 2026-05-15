// Mock Users Data Provider
// Simulates API responses for user management

export interface MockUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'hr' | 'admin';
  domain?: 'Web' | 'ML' | 'DSA' | 'Cloud';
  score?: number | string;
  status?: 'qualified' | 'partial' | 'not_qualified';
  joinedDate: string;
  isActive?: boolean;
  lastLogin?: string;
}

const mockUsersData: MockUser[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    role: 'student', 
    domain: 'Web', 
    score: 850, 
    status: 'qualified',
    joinedDate: '2024-04-10',
    isActive: true,
    lastLogin: '2024-04-15T10:30:00Z'
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    role: 'student', 
    domain: 'ML', 
    score: 920, 
    status: 'qualified',
    joinedDate: '2024-04-09',
    isActive: true,
    lastLogin: '2024-04-14T15:45:00Z'
  },
  { 
    id: 3, 
    name: 'Tech Corp HR', 
    email: 'hr@techcorp.com', 
    role: 'hr', 
    score: '-', 
    joinedDate: '2024-04-08',
    isActive: true,
    lastLogin: '2024-04-15T09:20:00Z'
  },
  { 
    id: 4, 
    name: 'Alice Johnson', 
    email: 'alice@example.com', 
    role: 'student', 
    domain: 'DSA', 
    score: 780, 
    status: 'partial',
    joinedDate: '2024-04-07',
    isActive: true,
    lastLogin: '2024-04-13T14:10:00Z'
  },
  { 
    id: 5, 
    name: 'StartUp Inc HR', 
    email: 'hr@startup.com', 
    role: 'hr', 
    score: '-', 
    joinedDate: '2024-04-06',
    isActive: true,
    lastLogin: '2024-04-14T11:30:00Z'
  },
  { 
    id: 6, 
    name: 'Bob Wilson', 
    email: 'bob@example.com', 
    role: 'student', 
    domain: 'Cloud' as any, 
    score: 720, 
    status: 'partial',
    joinedDate: '2024-04-05',
    isActive: true,
    lastLogin: '2024-04-12T16:20:00Z'
  },
  { 
    id: 7, 
    name: 'Emma Davis', 
    email: 'emma@example.com', 
    role: 'student', 
    domain: 'Web', 
    score: 890, 
    status: 'qualified',
    joinedDate: '2024-04-04',
    isActive: true,
    lastLogin: '2024-04-15T08:45:00Z'
  },
  { 
    id: 8, 
    name: 'Global Tech HR', 
    email: 'hr@globaltech.com', 
    role: 'hr', 
    score: '-', 
    joinedDate: '2024-04-03',
    isActive: false,
    lastLogin: '2024-04-10T12:15:00Z'
  },
  { 
    id: 9, 
    name: 'Mike Chen', 
    email: 'mike@example.com', 
    role: 'student', 
    domain: 'ML', 
    score: 650, 
    status: 'not_qualified',
    joinedDate: '2024-04-02',
    isActive: true,
    lastLogin: '2024-04-11T13:30:00Z'
  },
  { 
    id: 10, 
    name: 'Sarah Brown', 
    email: 'sarah@example.com', 
    role: 'student', 
    domain: 'DSA', 
    score: 810, 
    status: 'qualified',
    joinedDate: '2024-04-01',
    isActive: true,
    lastLogin: '2024-04-14T17:20:00Z'
  }
];

// Simulate API delay
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockUsersService = {
  // Get all users (for admin)
  async getAll() {
    await simulateDelay();
    return {
      success: true,
      data: mockUsersData,
      total: mockUsersData.length
    };
  },

  // Get user by ID
  async getById(id: number) {
    await simulateDelay();
    const user = mockUsersData.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      success: true,
      data: user
    };
  },

  // Update user
  async update(id: number, userData: Partial<MockUser>) {
    await simulateDelay(600);
    const index = mockUsersData.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    mockUsersData[index] = { ...mockUsersData[index], ...userData };
    
    return {
      success: true,
      data: mockUsersData[index],
      message: 'User updated successfully'
    };
  },

  // Delete user
  async delete(id: number) {
    await simulateDelay(400);
    const index = mockUsersData.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    // Mark as inactive instead of actual deletion
    mockUsersData[index].isActive = false;
    
    return {
      success: true,
      message: 'User deactivated successfully'
    };
  },

  // Get users by role
  async getByRole(role: 'student' | 'hr' | 'admin') {
    await simulateDelay();
    const filteredUsers = mockUsersData.filter(u => u.role === role && u.isActive);
    return {
      success: true,
      data: filteredUsers
    };
  },

  // Search users
  async search(query: string) {
    await simulateDelay();
    const filteredUsers = mockUsersData.filter(u => 
      u.isActive && (
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    );
    return {
      success: true,
      data: filteredUsers
    };
  }
};