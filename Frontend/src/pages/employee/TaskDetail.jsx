import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import {
  getCurrentUserInfo,
  taskApi,
  taskTransformers,
  checkTeamLeaderStatus
} from '../../services/taskApi';
import DashboardHeader from "../../components/DashboardHeader";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [allAttachments, setAllAttachments] = useState([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileType, setFileType] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userRole, setUserRole] = useState('employee');

  useEffect(() => {
    const loadUserAndTask = async () => {
      try {
        const user = await getCurrentUserInfo();
        if (!user) {
          alert('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
        
        setCurrentUser(user);
        
        const isTeamLeader = await checkTeamLeaderStatus(user.id);
        setUserRole(isTeamLeader ? 'team-leader' : 'employee');
        
        if (id) {
          await fetchTaskDetail(user);
        } else {
          setError('No task ID provided');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        alert('Failed to load user information. Please login again.');
        navigate('/login');
      }
    };

    loadUserAndTask();
  }, [id, navigate]);

  const fetchTaskDetail = async (user) => {
    try {
      setLoading(true);
      setError('');
      setFileLoading(true);
      setFileError('');
      setFileUrl(null);
      setCurrentAttachment(null);
      setFileType(null);
      setIsDownloading(false);

      const response = await taskApi.getTaskDetails(id);
      
      if (response.success && response.data) {
        const formattedTask = taskTransformers.transformTask(response.data);
        setTask(formattedTask);

        const userEmail = user.email;
        const userId = user.id;
        const isAssigned = checkIfUserIsAssigned(response.data, userEmail, userId);
        setReadOnly(!isAssigned);

        if (response.data.attachments && Array.isArray(response.data.attachments)) {
          const attachments = response.data.attachments;
          setAllAttachments(attachments);

          const previewableAttachment = attachments.find(att => 
            taskTransformers.isPreviewableFile(att)
          );

          if (previewableAttachment) {
            setCurrentAttachment(previewableAttachment);
            const type = taskTransformers.getFileType(previewableAttachment);
            setFileType(type);
            
            const previewUrl = taskApi.getAttachmentPreviewUrl(id, previewableAttachment._id);
            setFileUrl(previewUrl);
            setFileError('');
          } else if (attachments.length > 0) {
            setFileError('No previewable files (PDF or images) attached to this task');
          } else {
            setFileError('No documents attached to this task');
          }
        } else {
          setFileError('No documents attached to this task');
        }
        
        setFileLoading(false);
        setLoading(false);
      } else {
        setError('Failed to load task details');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      
      try {
        await fetchTaskFromAllTasks(user);
      } catch (fallbackError) {
        setError(error.message || 'Failed to load task details', fallbackError);
        setFileError('Failed to load task details');
        setLoading(false);
      }
    }
  };

  const fetchTaskFromAllTasks = async (user) => {
    try {
      const response = await taskApi.getAllTasks();
      
      if (response.success && Array.isArray(response.data)) {
        const foundTask = response.data.find(task => task._id === id);
        
        if (!foundTask) {
          setError(`Task with ID ${id} not found in your tasks`);
          setLoading(false);
          return;
        }
        
        const formattedTask = taskTransformers.transformTask(foundTask);
        setTask(formattedTask);
        
        const isAssigned = checkIfUserIsAssigned(foundTask, user.email, user.id);
        setReadOnly(!isAssigned);
        
        if (foundTask.attachments && Array.isArray(foundTask.attachments)) {
          setAllAttachments(foundTask.attachments);
          
          const previewableAttachment = foundTask.attachments.find(att => 
            taskTransformers.isPreviewableFile(att)
          );
          
          if (previewableAttachment) {
            setCurrentAttachment(previewableAttachment);
            const type = taskTransformers.getFileType(previewableAttachment);
            setFileType(type);
            
            const previewUrl = taskApi.getAttachmentPreviewUrl(id, previewableAttachment._id);
            setFileUrl(previewUrl);
            setFileError('');
          }
        }
        
        setLoading(false);
      } else {
        setError('No tasks found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw error;
    }
  };

  const checkIfUserIsAssigned = (task, userEmail, userId) => {
    if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
    
    return task.assignedTo.some(assigned => {
      if (typeof assigned === 'object') {
        return assigned.email === userEmail || assigned._id === userId;
      }
      if (typeof assigned === 'string') {
        return assigned === userEmail || assigned === userId;
      }
      return false;
    });
  };

  const handleUpdateStatus = async (newStatus) => {
    if (readOnly) {
      alert('You can only update status for tasks assigned to you.');
      return;
    }

    try {
      const result = await taskApi.updateTaskStatus(id, newStatus);
      
      if (result.success) {
        updateTaskStatusLocal(newStatus);
        
        setTimeout(() => {
          const user = currentUser || getCurrentUserInfo();
          if (user) fetchTaskDetail(user);
        }, 500);
        
        alert(`Task marked as ${newStatus}!`);
      } else {
        throw new Error(result.message || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task: ' + error.message);
      
      const user = currentUser || getCurrentUserInfo();
      if (user) fetchTaskDetail(user);
    }
  };

  const updateTaskStatusLocal = (newStatus) => {
    setTask(prev => ({
      ...prev,
      status: newStatus.toLowerCase(),
    }));
  };

  const handleDownloadAttachment = async (attachment) => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      await taskApi.downloadAttachment(id, attachment._id, attachment.originalName);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      } else {
        alert(`Error downloading file: ${error.message}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectAttachment = async (attachment) => {
    setCurrentAttachment(attachment);
    const type = taskTransformers.getFileType(attachment);
    setFileType(type);
    
    const previewUrl = taskApi.getAttachmentPreviewUrl(id, attachment._id);
    setFileUrl(previewUrl);
  };

  const FileViewer = ({ fileUrl, attachment, onDownload }) => {
    const isPdf = fileType === 'pdf';
    const isImage = fileType === 'image';

    const handleOpenInNewTab = () => {
      if (fileUrl) {
        const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
      }
    };

    return (
      <div className="h-[300px] md:h-[500px] border-2 border-gray-200 rounded-lg overflow-hidden">
        {isImage ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden bg-gray-900 flex items-center justify-center">
              <img
                src={fileUrl}
                alt={attachment?.originalName || 'Task Image'}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', fileUrl);
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="text-center text-white p-6">
                      <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                      <p>Failed to load image. Please download instead.</p>
                    </div>
                  `;
                }}
              />
            </div>
            <div className="bg-white border-t border-gray-200 p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-image text-blue-500 text-sm md:text-base"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm md:text-base">
                      {attachment?.originalName || 'Task Image'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {taskTransformers.formatFileSize(attachment?.fileSize || 0)} • Image
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-3 py-1.5 md:px-4 md:py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 md:gap-2 text-sm"
                  >
                    <i className="fas fa-external-link-alt text-xs md:text-sm"></i>
                    <span className="hidden md:inline">Open Full</span>
                    <span className="md:hidden">Open</span>
                  </button>
                  <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 text-sm"
                  >
                    <i className="fas fa-download text-xs md:text-sm"></i>
                    <span className="hidden md:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
                    <span className="md:hidden">DL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isPdf ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
            <div className="bg-white border-t border-gray-200 p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-pdf text-red-500 text-sm md:text-base"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm md:text-base">
                      {attachment?.originalName || 'Task Document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {taskTransformers.formatFileSize(attachment?.fileSize || 0)} • PDF
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-3 py-1.5 md:px-4 md:py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 md:gap-2 text-sm"
                  >
                    <i className="fas fa-external-link-alt text-xs md:text-sm"></i>
                    <span className="hidden md:inline">Open in New Tab</span>
                    <span className="md:hidden">Open</span>
                  </button>
                  <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 text-sm"
                  >
                    <i className="fas fa-download text-xs md:text-sm"></i>
                    <span className="hidden md:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
                    <span className="md:hidden">DL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4 md:p-6">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
              <i className="fas fa-file text-blue-500 text-3xl md:text-5xl"></i>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 text-center">
              {attachment?.originalName || 'Task Attachment'}
            </h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-center text-sm md:text-base">
              This file type cannot be previewed. Please download to view.
            </p>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm md:text-base"
            >
              <i className="fas fa-download"></i>
              {isDownloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const getButtonClasses = (color, isDisabled = false) => {
    const baseClasses =
      'px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold border-2 flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 text-sm md:text-base';

    if (isDisabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed border-gray-300 text-gray-400`;
    }

    switch (color) {
      case 'green':
        return `${baseClasses} text-green-600 bg-white hover:bg-green-50 border-green-600 hover:shadow-md`;
      case 'red':
        return `${baseClasses} text-red-600 bg-white hover:bg-red-50 border-red-600 hover:shadow-md`;
      case 'blue':
        return `${baseClasses} text-blue-600 bg-white hover:bg-blue-50 border-blue-600 hover:shadow-md`;
      default:
        return `${baseClasses} text-gray-600 bg-white hover:bg-gray-50 border-gray-600 hover:shadow-md`;
    }
  };

  const getCurrentTaskButtonConfig = () => {
    if (!task) return null;
    return taskTransformers.getStatusButtonConfig(task.status);
  };

  const handleUpdateStatusClick = () => {
    if (!task || readOnly) return;
    const buttonConfig = taskTransformers.getStatusButtonConfig(task.status);
    handleUpdateStatus(buttonConfig.nextStatus);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'border-red-500 text-red-600';
      case 'medium':
        return 'border-yellow-500 text-yellow-600';
      case 'low':
        return 'border-green-500 text-green-600';
      default:
        return 'border-gray-500 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role={userRole} activeItem="task" />
        <main className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading task details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="flex h-screen">
        <Sidebar role={userRole} activeItem="task" />
        <main className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Task Not Found
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/tasks')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>Back to Tasks
            </button>
          </div>
        </main>
      </div>
    );
  }

  const buttonConfig = getCurrentTaskButtonConfig();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={userRole} activeItem="task" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Task: {task?.title || 'Untitled Task'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-gray-600 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <i className="fas fa-flag text-gray-400"></i>
                  <span>
                    Milestone:{' '}
                    <strong className="text-gray-800">
                      {task?.milestone || 'No Milestone'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <i className="far fa-calendar-alt text-gray-400"></i>
                  <span>
                    Created:{' '}
                    <strong className="text-gray-800">{task?.createdAt}</strong>
                  </span>
                </div>
              </div>
            </div>

            {readOnly && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p className="font-medium">Read-only Access</p>
                </div>
                <p className="text-xs md:text-sm mt-1">You can only view this task because you are not assigned to it.</p>
              </div>
            )}

            {error && !readOnly && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm md:text-base">
                <p className="font-medium">Error:</p>
                <p className="text-xs md:text-sm">{error}</p>
              </div>
            )}

            {task && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
                  <div className="flex-1 border border-gray-200 rounded-lg p-3 md:p-4">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">
                      Task Details
                    </h2>
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Task:</h3>
                        <p className="text-gray-900 md:text-lg font-medium">
                          {task.title}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Objective:</h3>
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-line text-sm md:text-base">
                            {task.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Deadline:</h3>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-calendar text-gray-500"></i>
                            <span
                              className={`font-semibold ${task.deadline &&
                                task.deadline !== 'No deadline' &&
                                taskTransformers.isOverdue(task.deadline)
                                  ? 'text-red-600'
                                  : 'text-gray-800'
                              }`}
                            >
                              {taskTransformers.formatDate(task.deadline)}
                            </span>
                            {task.deadline &&
                              task.deadline !== 'No deadline' &&
                              taskTransformers.isOverdue(task.deadline) && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                  Overdue
                                </span>
                              )}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Priority:</h3>
                          <div
                            className={`inline-flex items-center gap-1 md:gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${task.priority === 'high'
                                  ? 'bg-red-500'
                                  : task.priority === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                            ></div>
                            <span className="capitalize text-sm">{task.priority}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Assignees:</h3>
                        <div className="space-y-2">
                          {task.assigneeObjects && task.assigneeObjects.length > 0 ? (
                            task.assigneeObjects.map((assignee, index) => (
                              <div
                                key={assignee.id || index}
                                className="flex items-center gap-2 md:gap-3 p-2 hover:bg-gray-50 rounded"
                              >
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm md:text-base">
                                  {assignee.avatar}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 text-sm md:text-base truncate">
                                    {assignee.name}
                                  </p>
                                  <p className="text-xs md:text-sm text-gray-500 truncate">
                                    {assignee.email}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 md:gap-3 p-2">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                                <i className="fas fa-user-slash text-sm md:text-base"></i>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm md:text-base">Unassigned</p>
                                <p className="text-xs md:text-sm text-gray-500">No assignees yet</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1 text-sm md:text-base">Status:</h3>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'in progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {task.status?.charAt(0).toUpperCase() +
                              task.status?.slice(1)}
                          </div>
                          <div
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${task.status === 'completed'
                                ? 'bg-green-500'
                                : task.status === 'in progress'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}
                          ></div>
                        </div>
                      </div>
                      
                      {allAttachments.length > 0 && (
                        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                          <h3 className="font-medium text-gray-700 mb-2 text-sm md:text-base">
                            All Attachments ({allAttachments.length}):
                          </h3>
                          <div className="space-y-2 max-h-40 md:max-h-60 overflow-y-auto">
                            {allAttachments.map((attachment) => {
                              const isCurrent = currentAttachment?._id === attachment._id;
                              const type = taskTransformers.getFileType(attachment);
                              return (
                                <div
                                  key={attachment._id}
                                  className={`flex items-center justify-between p-2 md:p-3 rounded-lg border ${isCurrent
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'hover:bg-gray-50 border-gray-200'
                                    } cursor-pointer`}
                                  onClick={() => handleSelectAttachment(attachment)}
                                >
                                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      {type === 'pdf' ? (
                                        <i className="fas fa-file-pdf text-red-500 text-base md:text-xl"></i>
                                      ) : type === 'image' ? (
                                        <i className="fas fa-file-image text-green-500 text-base md:text-xl"></i>
                                      ) : attachment.fileType?.includes('word') ||
                                        attachment.originalName?.endsWith('.docx') ||
                                        attachment.originalName?.endsWith('.doc') ? (
                                        <i className="fas fa-file-word text-blue-500 text-base md:text-xl"></i>
                                      ) : (
                                        <i className="fas fa-file text-gray-500 text-base md:text-xl"></i>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-gray-800 truncate text-xs md:text-sm">
                                        {attachment.originalName}
                                        {isCurrent && (
                                          <span className="ml-1 text-xs text-blue-600">
                                            (Viewing)
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {taskTransformers.formatFileSize(attachment.fileSize)} •{' '}
                                        {type === 'pdf'
                                          ? 'PDF'
                                          : type === 'image'
                                            ? 'Image'
                                            : attachment.fileType || 'File'}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadAttachment(attachment);
                                    }}
                                    disabled={isDownloading}
                                    className="ml-1 md:ml-2 p-1 md:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm md:text-base"
                                    title="Download"
                                  >
                                    <i className="fas fa-download"></i>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="border border-gray-200 rounded-lg p-3 md:p-4 h-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 gap-2">
                        <div className="flex items-center gap-2">
                          {fileType === 'pdf' ? (
                            <i className="fas fa-file-pdf text-red-500"></i>
                          ) : fileType === 'image' ? (
                            <i className="fas fa-file-image text-green-500"></i>
                          ) : (
                            <i className="fas fa-file text-gray-500"></i>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">
                              {currentAttachment
                                ? currentAttachment.originalName
                                : 'File Preview'}
                            </h3>
                            {currentAttachment && (
                              <p className="text-xs text-gray-500">
                                {taskTransformers.formatFileSize(currentAttachment.fileSize)} •{' '}
                                {fileType === 'pdf'
                                  ? 'PDF Document'
                                  : fileType === 'image'
                                    ? 'Image'
                                    : 'File'}
                              </p>
                            )}
                          </div>
                        </div>
                        {currentAttachment && (
                          <button
                            onClick={() => handleDownloadAttachment(currentAttachment)}
                            disabled={isDownloading}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 text-xs md:text-sm w-full md:w-auto justify-center"
                          >
                            <i className="fas fa-download"></i>
                            {isDownloading
                              ? 'Downloading...'
                              : fileType === 'pdf'
                                ? 'Download PDF'
                                : fileType === 'image'
                                  ? 'Download Image'
                                  : 'Download File'}
                          </button>
                        )}
                      </div>
                      
                      {fileLoading ? (
                        <div className="flex items-center justify-center h-[300px] md:h-[500px] border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 md:h-10 w-8 md:w-10 border-b-2 border-blue-600 mx-auto mb-2 md:mb-3"></div>
                            <p className="text-gray-600 text-sm md:text-base">
                              Loading{' '}
                              {fileType === 'pdf'
                                ? 'PDF'
                                : fileType === 'image'
                                  ? 'image'
                                  : 'file'}
                              ...
                            </p>
                          </div>
                        </div>
                      ) : fileUrl && currentAttachment ? (
                        <FileViewer
                          fileUrl={fileUrl}
                          attachment={currentAttachment}
                          onDownload={() => handleDownloadAttachment(currentAttachment)}
                        />
                      ) : fileError ? (
                        <div className="flex flex-col items-center justify-center h-[300px] md:h-[500px] border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="w-12 h-12 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                            <i className="fas fa-file text-xl md:text-4xl text-gray-400"></i>
                          </div>
                          <h3 className="text-base md:text-lg font-medium text-gray-800 mb-1 md:mb-2">
                            No Preview Available
                          </h3>
                          <p className="text-gray-600 text-center mb-4 md:mb-6 text-xs md:text-sm px-2">
                            {fileError}
                          </p>
                          {allAttachments.length > 0 && (
                            <button
                              onClick={() => handleDownloadAttachment(allAttachments[0])}
                              disabled={isDownloading}
                              className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                            >
                              <i className="fas fa-download"></i>
                              Download First Attachment
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] md:h-[500px] border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="w-12 h-12 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                            <i className="fas fa-file text-xl md:text-4xl text-gray-400"></i>
                          </div>
                          <h3 className="text-base md:text-lg font-medium text-gray-800 mb-1 md:mb-2">
                            No File Attached
                          </h3>
                          <p className="text-gray-600 text-center mb-4 md:mb-6 text-xs md:text-sm px-2">
                            This task doesn't have any attached files.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
              {buttonConfig && (
                <button
                  onClick={handleUpdateStatusClick}
                  disabled={
                    readOnly ||
                    task?.status === buttonConfig.nextStatus.toLowerCase()
                  }
                  className={getButtonClasses(
                    buttonConfig.color,
                    readOnly ||
                      task?.status === buttonConfig.nextStatus.toLowerCase()
                  )}
                >
                  <i className={`fas fa-${buttonConfig.icon.toLowerCase()} text-xs md:text-sm`}></i>
                  <span className="text-xs md:text-sm">{buttonConfig.label}</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskDetail;