// Mock Tests Data Provider
// Simulates API responses for test management

export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  domain: 'Web' | 'ML' | 'DSA';
}

export interface MockTest {
  id: number;
  name: string;
  domain: 'Web' | 'ML' | 'DSA';
  questions: MockQuestion[];
  createdAt: string;
  isActive: boolean;
  timeLimit?: number; // in minutes
  passingScore?: number;
}

const mockTestsData: MockTest[] = [
  {
    id: 1,
    name: 'Web Development Fundamentals',
    domain: 'Web',
    createdAt: '2024-04-01T10:00:00Z',
    isActive: true,
    timeLimit: 60,
    passingScore: 70,
    questions: [
      {
        id: '1',
        question: 'What is the purpose of the useState hook in React?',
        options: [
          'To manage component state',
          'To handle side effects',
          'To optimize performance',
          'To create components'
        ],
        correctAnswer: 'To manage component state',
        domain: 'Web'
      },
      {
        id: '2',
        question: 'Which HTTP method is used to update a resource?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correctAnswer: 'PUT',
        domain: 'Web'
      },
      {
        id: '3',
        question: 'What does CSS stand for?',
        options: [
          'Computer Style Sheets',
          'Cascading Style Sheets',
          'Creative Style Sheets',
          'Colorful Style Sheets'
        ],
        correctAnswer: 'Cascading Style Sheets',
        domain: 'Web'
      }
    ]
  },
  {
    id: 2,
    name: 'Machine Learning Basics',
    domain: 'ML',
    createdAt: '2024-04-02T14:30:00Z',
    isActive: true,
    timeLimit: 90,
    passingScore: 75,
    questions: [
      {
        id: '4',
        question: 'What is supervised learning?',
        options: [
          'Learning without labeled data',
          'Learning with labeled training data',
          'Learning through trial and error',
          'Learning from user feedback'
        ],
        correctAnswer: 'Learning with labeled training data',
        domain: 'ML'
      },
      {
        id: '5',
        question: 'Which algorithm is commonly used for classification?',
        options: ['K-means', 'Linear Regression', 'Random Forest', 'PCA'],
        correctAnswer: 'Random Forest',
        domain: 'ML'
      }
    ]
  },
  {
    id: 3,
    name: 'Data Structures and Algorithms',
    domain: 'DSA',
    createdAt: '2024-04-03T09:15:00Z',
    isActive: true,
    timeLimit: 120,
    passingScore: 80,
    questions: [
      {
        id: '6',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 'O(log n)',
        domain: 'DSA'
      },
      {
        id: '7',
        question: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 'Stack',
        domain: 'DSA'
      }
    ]
  }
];

// Simulate API delay
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockTestsService = {
  // Get all tests
  async getAll() {
    await simulateDelay();
    return {
      success: true,
      data: mockTestsData.filter(test => test.isActive)
    };
  },

  // Get test by ID
  async getById(id: number) {
    await simulateDelay();
    const test = mockTestsData.find(t => t.id === id);
    if (!test) {
      throw new Error('Test not found');
    }
    return {
      success: true,
      data: test
    };
  },

  // Create new test
  async create(testData: {
    name: string;
    domain: 'Web' | 'ML' | 'DSA';
    questions: MockQuestion[];
    timeLimit?: number;
    passingScore?: number;
  }) {
    await simulateDelay(1000);
    
    const newTest: MockTest = {
      id: Date.now(),
      name: testData.name,
      domain: testData.domain,
      questions: testData.questions.map((q, index) => ({
        ...q,
        id: `${Date.now()}_${index}`
      })),
      createdAt: new Date().toISOString(),
      isActive: true,
      timeLimit: testData.timeLimit || 60,
      passingScore: testData.passingScore || 70
    };
    
    mockTestsData.push(newTest);
    
    return {
      success: true,
      data: newTest,
      message: 'Test created successfully'
    };
  },

  // Update test
  async update(id: number, testData: Partial<MockTest>) {
    await simulateDelay(800);
    const index = mockTestsData.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Test not found');
    }
    
    mockTestsData[index] = { ...mockTestsData[index], ...testData };
    
    return {
      success: true,
      data: mockTestsData[index],
      message: 'Test updated successfully'
    };
  },

  // Delete test
  async delete(id: number) {
    await simulateDelay(400);
    const index = mockTestsData.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Test not found');
    }
    
    // Mark as inactive instead of actual deletion
    mockTestsData[index].isActive = false;
    
    return {
      success: true,
      message: 'Test deleted successfully'
    };
  },

  // Get tests by domain
  async getByDomain(domain: 'Web' | 'ML' | 'DSA') {
    await simulateDelay();
    const filteredTests = mockTestsData.filter(t => t.domain === domain && t.isActive);
    return {
      success: true,
      data: filteredTests
    };
  }
};