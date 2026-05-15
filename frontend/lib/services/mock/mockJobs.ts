// Mock Jobs Data Provider
// Simulates API responses with realistic data and delays

export interface MockJob {
  id: number;
  title: string;
  domain: 'Web' | 'ML' | 'DSA' | 'Cloud';
  positions: number;
  applicants: number;
  postedDate: string;
  status: 'active' | 'closed' | 'draft';
  description?: string;
  requirements?: string[];
  company?: string;
  location?: string;
  salary?: string;
}

const mockJobsData: MockJob[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    domain: 'Web',
    positions: 5,
    applicants: 23,
    postedDate: '2024-04-01',
    status: 'active',
    description: 'We are looking for a skilled Frontend Developer to join our team.',
    requirements: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    company: 'Tech Corp',
    location: 'Remote',
    salary: '$70,000 - $90,000'
  },
  {
    id: 2,
    title: 'Backend Developer',
    domain: 'Web',
    positions: 4,
    applicants: 18,
    postedDate: '2024-04-03',
    status: 'active',
    description: 'Join our backend team to build scalable APIs and services.',
    requirements: ['Node.js', 'PostgreSQL', 'Express', 'Docker'],
    company: 'StartUp Inc',
    location: 'San Francisco, CA',
    salary: '$80,000 - $100,000'
  },
  {
    id: 3,
    title: 'Data Scientist',
    domain: 'ML',
    positions: 2,
    applicants: 10,
    postedDate: '2024-04-05',
    status: 'active',
    description: 'Analyze data and build machine learning models.',
    requirements: ['Python', 'TensorFlow', 'Pandas', 'SQL'],
    company: 'AI Solutions',
    location: 'New York, NY',
    salary: '$90,000 - $120,000'
  },
  {
    id: 4,
    title: 'Cloud Engineer',
    domain: 'Cloud' as any,
    positions: 3,
    applicants: 15,
    postedDate: '2024-04-07',
    status: 'active',
    description: 'Design and maintain cloud infrastructure.',
    requirements: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
    company: 'Cloud Systems',
    location: 'Seattle, WA',
    salary: '$85,000 - $110,000'
  },
  {
    id: 5,
    title: 'Full Stack Developer',
    domain: 'Web',
    positions: 6,
    applicants: 31,
    postedDate: '2024-04-10',
    status: 'active',
    description: 'Work on both frontend and backend development.',
    requirements: ['React', 'Node.js', 'MongoDB', 'GraphQL'],
    company: 'Digital Agency',
    location: 'Austin, TX',
    salary: '$75,000 - $95,000'
  }
];

// Simulate API delay
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockJobsService = {
  // Get all jobs (for students)
  async getAll() {
    await simulateDelay();
    return {
      success: true,
      data: mockJobsData.filter(job => job.status === 'active')
    };
  },

  // Get jobs posted by current HR user
  async getMyJobs() {
    await simulateDelay();
    // Simulate HR user's jobs (first 3 jobs)
    return {
      success: true,
      data: mockJobsData.slice(0, 3)
    };
  },

  // Get single job by ID
  async getById(id: number) {
    await simulateDelay();
    const job = mockJobsData.find(j => j.id === id);
    if (!job) {
      throw new Error('Job not found');
    }
    return {
      success: true,
      data: job
    };
  },

  // Create new job
  async create(jobData: Partial<MockJob>) {
    await simulateDelay(800);
    const newJob: MockJob = {
      id: Date.now(), // Simple ID generation
      title: jobData.title || 'New Job',
      domain: jobData.domain || 'Web',
      positions: jobData.positions || 1,
      applicants: 0,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      ...jobData
    };
    
    mockJobsData.push(newJob);
    
    return {
      success: true,
      data: newJob,
      message: 'Job created successfully'
    };
  },

  // Update job
  async update(id: number, jobData: Partial<MockJob>) {
    await simulateDelay(600);
    const index = mockJobsData.findIndex(j => j.id === id);
    if (index === -1) {
      throw new Error('Job not found');
    }
    
    mockJobsData[index] = { ...mockJobsData[index], ...jobData };
    
    return {
      success: true,
      data: mockJobsData[index],
      message: 'Job updated successfully'
    };
  },

  // Delete job
  async delete(id: number) {
    await simulateDelay(400);
    const index = mockJobsData.findIndex(j => j.id === id);
    if (index === -1) {
      throw new Error('Job not found');
    }
    
    mockJobsData.splice(index, 1);
    
    return {
      success: true,
      message: 'Job deleted successfully'
    };
  }
};