import axios from 'axios';

const API_URL =
  `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION}` ||
  'http://localhost:8090/api/v1';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to inject token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get token from cookies
const getToken = () => {
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('access_token=')) {
      return cookie.substring('access_token='.length);
    }
  }

  // Also check localStorage as fallback
  return localStorage.getItem('token') || null;
};

// Helper function to get FormData headers for multipart requests
const getFormDataHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'multipart/form-data',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Parse JWT token
export const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Get current user info
export const getCurrentUserInfo = async () => {
  try {
    // Try to get from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.isTeamLeader !== undefined) {
        return parsedUser;
      }
    }

    const token = getToken();
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload) return null;

    // Extract user info
    const userId = payload._id || payload.userid || payload.id;
    const userEmail = payload.email || 'user@example.com';

    // Get user name
    let userName = 'User';
    if (payload.FirstName && payload.LastName) {
      userName = `${payload.FirstName} ${payload.LastName}`.trim();
    } else if (payload.firstName && payload.lastName) {
      userName = `${payload.firstName} ${payload.lastName}`.trim();
    } else if (payload.name) {
      userName = payload.name;
    } else if (payload.username) {
      userName = payload.username;
    } else {
      userName = userEmail.split('@')[0];
    }

    // Create user object
    const user = {
      id: userId,
      _id: userId,
      name: userName,
      email: userEmail,
      role: payload.role || 1,
      isTeamLeader: false,
    };

    // Check team leader status
    if (userId) {
      user.isTeamLeader = await checkTeamLeaderStatus(userId);
    }

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user is a team leader
export const checkTeamLeaderStatus = async (userId) => {
  try {
    const response = await axiosInstance.get('/projects/getAllProjects');

    if (response.data.success && Array.isArray(response.data.data)) {
      const isTeamLeader = response.data.data.some((project) => {
        if (!project.teamLeader) return false;

        const teamLeaderId =
          project.teamLeader?._id ||
          project.teamLeader?.id ||
          project.teamLeader;

        return teamLeaderId && teamLeaderId.toString() === userId.toString();
      });

      return isTeamLeader;
    }
    return false;
  } catch (error) {
    console.error('Error checking team leader status:', error);
    return false;
  }
};

// Task API functions
export const taskApi = {
  // Get all tasks
  getAllTasks: async () => {
    try {
      const response = await axiosInstance.get('/task/getAllTasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw error;
    }
  },

  // Get user tasks (tasks assigned to current user)
  getUserTasks: async (userEmail, userId) => {
    try {
      const response = await axiosInstance.get('/task/getAllUserTasks');
      
      const tasks = response.data.data.filter((task) => {
        if (!Array.isArray(task.assignedTo)) return false;

        return task.assignedTo.some((assigned) => {
          // case 1: assignedTo = ["USER_ID"]
          if (typeof assigned === 'string') {
            return (
              assigned.toString() === userId?.toString() ||
              assigned.toString() === userEmail
            );
          }

          // case 2: assignedTo = [{ _id, email }]
          if (assigned && typeof assigned === 'object') {
            if (assigned._id?.toString() === userId?.toString()) return true;
            if (assigned.email && assigned.email === userEmail) return true;
          }

          return false;
        });
      });

      return tasks;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  },

  // Get task details
  getTaskDetails: async (taskId) => {
    try {
      const response = await axiosInstance.get(`/task/taskDetails/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task details:', error);
      throw error;
    }
  },

  // Create task
  createTask: async (taskData, attachments = []) => {
    try {
      const formData = new FormData();

      // Append task data
      Object.keys(taskData).forEach((key) => {
        if (Array.isArray(taskData[key])) {
          taskData[key].forEach((item) => {
            formData.append(key, item);
          });
        } else {
          formData.append(key, taskData[key]);
        }
      });

      // Append attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // Use axios directly for multipart form data
      const response = await axios.post(
        `${API_URL}/task/createTask`,
        formData,
        {
          headers: getFormDataHeaders(),
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await axiosInstance.put(
        `/task/updateTask/${taskId}`,
        taskData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await axiosInstance.patch(
        `/task/updateTaskStatus/${taskId}`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const response = await axiosInstance.delete(`/task/deleteTask/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Get attachment preview URL
  getAttachmentPreviewUrl: (taskId, attachmentId) => {
    return `${API_URL}/task/${taskId}/attachments/${attachmentId}/preview`;
  },

  // Get attachment download URL
  getAttachmentDownloadUrl: (taskId, attachmentId) => {
    return `${API_URL}/task/${taskId}/attachments/${attachmentId}/download`;
  },

  // Download attachment
  downloadAttachment: async (taskId, attachmentId, filename) => {
    try {
      const response = await axiosInstance.get(
        `/task/${taskId}/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  },
};

// Employee API functions
export const employeeApi = {
  // Get employees by role
  getEmployeesByRole: async () => {
    try {
      const response = await axiosInstance.get('/employee/getEmloyeesByRole');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
};

// Project API functions
export const projectApi = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const response = await axiosInstance.get('/projects/getAllProjects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },
};

// Milestone API functions
export const milestoneApi = {
  // Get milestones for a project
  getMilestonesForProject: async (projectId) => {
    try {
      const response = await axiosInstance.get(
        `/millestone/getAllMilestones/${projectId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }
  },
};

// Helper functions for task transformation
export const taskTransformers = {
  // Transform task data for display
  transformTask: (task) => {
    const getDisplayName = (user) => {
      if (!user) return 'Unknown';
      if (typeof user === 'object') {
        return (
          user.name ||
          (user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : '') ||
          (user.FirstName && user.LastName
            ? `${user.FirstName} ${user.LastName}`.trim()
            : '') ||
          user.username ||
          user.email ||
          'Unknown User'
        );
      }
      if (typeof user === 'string') {
        return `User ${user.substring(0, 6)}`;
      }
      return 'Unknown User';
    };

    const getMilestone = (milestone) => {
      if (!milestone) return 'No Milestone';
      if (typeof milestone === 'object') {
        return (
          milestone.milestoneName ||
          milestone.name ||
          `M-${(milestone._id || '').slice(-4)}`
        );
      }
      return milestone;
    };

    const getProgress = (status) => {
      const stat = (status || '').toLowerCase();
      if (stat === 'completed') return 100;
      if (stat === 'in progress' || stat === 'in-progress') return 50;
      return 0;
    };

    const formatDate = (date) =>
      date ? new Date(date).toISOString().split('T')[0] : null;

    // Transform assignees to have both objects and strings
    const assigneeObjects = (task.assignedTo || []).map((user) => {
      if (typeof user === 'object' && user) {
        return {
          id: user._id || user.id || user.userId,
          _id: user._id || user.id || user.userId,
          name: getDisplayName(user),
          email: user.email || 'No email',
          avatar: (user.name || user.firstName || user.FirstName || 'U')
            .charAt(0)
            .toUpperCase(),
        };
      }

      if (typeof user === 'string') {
        return {
          id: user,
          _id: user,
          name: `User ${user.substring(0, 6)}`,
          email: 'No email',
          avatar: 'U',
        };
      }

      return {
        id: 'unknown',
        _id: 'unknown',
        name: 'Unknown User',
        email: 'No email',
        avatar: 'U',
      };
    });

    // Get assignee names as strings for display
    const assigneeNames = assigneeObjects.map((assignee) => assignee.name);
    const assigneeEmails = assigneeObjects.map((assignee) => assignee.email);

    // Get PDF attachments
    const pdfAttachments = (task.attachments || []).filter(
      (att) =>
        att.fileType?.toLowerCase() === 'application/pdf' ||
        att.originalName?.toLowerCase().endsWith('.pdf') ||
        att.filename?.toLowerCase().endsWith('.pdf')
    );

    return {
      id: task._id || task.id,
      _id: task._id || task.id,
      title: task.title || 'Untitled Task',
      milestone: getMilestone(task.milestone),
      description: task.description || 'No description provided',
      deadline: formatDate(task.deadline) || 'No deadline',
      priority: (task.priority || 'medium').toLowerCase(),
      status: (task.status || 'pending').toLowerCase(),
      progress: getProgress(task.status),
      assignees: assigneeNames.length > 0 ? assigneeNames : ['Unassigned'],
      assigneeObjects: assigneeObjects, // Keep the objects for detailed view
      assigneeEmails: assigneeEmails,
      attachments: task.attachments || [],
      pdfAttachments: pdfAttachments,
      createdAt: task.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : 'Unknown',
      createdBy: getDisplayName(task.createdBy) || 'Unknown',
      originalData: task,
    };
  },

  // Transform multiple tasks
  transformTasks: (tasks) => {
    return tasks.map(taskTransformers.transformTask);
  },

  // Format date for display
  formatDate: (dateString) => {
    if (!dateString || dateString === 'No deadline') return 'No deadline';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date.toDateString() === today.toDateString()) return 'Today';
      else if (date.toDateString() === tomorrow.toDateString())
        return 'Tomorrow';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  },

  // Format date with time
  formatDateTime: (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'Invalid date'
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return 'Invalid date';
    }
  },

  // Check if deadline is overdue
  isOverdue: (deadline) => {
    if (!deadline || deadline === 'No deadline') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(deadline);
      return deadlineDate < today;
    } catch {
      return false;
    }
  },

  // Get priority color classes
  getPriorityColor: (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Get status color classes
  getStatusColor: (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'in progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  },

  // Get status button configuration
  getStatusButtonConfig: (currentStatus) => {
    const status = (currentStatus || '').toLowerCase();

    if (status === 'pending') {
      return {
        label: 'In Progress',
        nextStatus: 'In Progress',
        color: 'green',
        icon: 'Clock',
      };
    } else if (status === 'in progress') {
      return {
        label: 'Mark as Done',
        nextStatus: 'Completed',
        color: 'red',
        icon: 'CheckCircle',
      };
    } else if (status === 'completed') {
      return {
        label: 'Reopen Task',
        nextStatus: 'Pending',
        color: 'blue',
        icon: 'Clock',
      };
    }

    return {
      label: 'In Progress',
      nextStatus: 'In Progress',
      color: 'green',
      icon: 'Clock',
    };
  },

  // Get button classes based on color
  getButtonClasses: (color, isDisabled = false) => {
    const baseClasses =
      'w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border-2 transition-all duration-300 font-semibold';

    if (isDisabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed border-gray-300 text-gray-400`;
    }

    switch (color) {
      case 'green':
        return `${baseClasses} text-green-600 bg-white hover:bg-green-600 hover:text-white border-green-600`;
      case 'red':
        return `${baseClasses} text-red-600 bg-white hover:bg-red-600 hover:text-white border-red-600`;
      case 'blue':
        return `${baseClasses} text-blue-600 bg-white hover:bg-blue-600 hover:text-white border-blue-600`;
      default:
        return `${baseClasses} text-gray-600 bg-white hover:bg-gray-600 hover:text-white border-gray-600`;
    }
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Check if file is previewable
  isPreviewableFile: (attachment) => {
    const fileName = attachment.originalName?.toLowerCase() || '';
    const fileType = attachment.fileType?.toLowerCase() || '';

    return (
      fileType.includes('pdf') ||
      fileType.includes('image') ||
      fileName.endsWith('.pdf') ||
      fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ||
      attachment.filename?.toLowerCase().endsWith('.pdf') ||
      attachment.filename
        ?.toLowerCase()
        .match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)
    );
  },

  // Get file type
  getFileType: (attachment) => {
    const fileName = attachment.originalName?.toLowerCase() || '';
    const fileType = attachment.fileType?.toLowerCase() || '';

    if (
      fileType.includes('pdf') ||
      fileName.endsWith('.pdf') ||
      attachment.filename?.toLowerCase().endsWith('.pdf')
    ) {
      return 'pdf';
    }
    if (
      fileType.includes('image') ||
      fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ||
      attachment.filename
        ?.toLowerCase()
        .match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)
    ) {
      return 'image';
    }
    return null;
  },
};

export default {
  getToken,
  parseJwt,
  getCurrentUserInfo,
  checkTeamLeaderStatus,
  taskApi,
  employeeApi,
  projectApi,
  milestoneApi,
  taskTransformers,
  axiosInstance,
};