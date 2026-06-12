// API base URL 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token') || '';
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(url);

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include'
  };

  try {
    const response = await fetch(url, config);
    console.log("response",response)
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Get all projects
export const getAllProjects = async () => {
  return apiRequest('/api/v1/projects/getAllProjects', {
    method: 'GET',
  });
};

// Get single project by ID
export const getProject = async (id) => {
  return apiRequest(`/api/v1/projects/getProject/${id}`, {
    method: 'GET',
  });
};

// Create a new project
export const createProject = async (projectData) => {
  return apiRequest('/api/v1/projects/createProject', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
};

// Update a project
export const updateProject = async (id, projectData) => {
  return apiRequest(`/api/v1/projects/updateProject/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });
};

// Delete a project
export const deleteProject = async (id) => {
  return apiRequest(`/api/v1/projects/deleteProject/${id}`, {
    method: 'DELETE',
  });
};

// Update project status
export const updateProjectStatus = async (id, status) => {
  return apiRequest(`/api/v1/projects/updateProjectStatus/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Get project progress report
export const getProjectReport = async (id) => {
  const endpoint = id ? `/api/v1/projects/projectReport/${id}` : '/api/v1/project/projectReport';
  return apiRequest(endpoint, {
    method: 'GET',
  });
};

// Get all users (for team leader dropdown)
export const getAllUsers = async () => {
  return apiRequest('/api/v1/employee/getEmloyeesByRole', {
    method: 'GET',
  });
};

// Get all employe (for team leader dropdown)
export const getAllEmployee = async () => {
  return apiRequest('/api/v1/employee/getAllEmployee', {
    method: 'GET',
  });
};

export const getAllMilestones = async (projectId) => {
  return apiRequest(`/api/v1/millestone/getAllMilestones/${projectId}`, {
    method: "GET",
  });
};