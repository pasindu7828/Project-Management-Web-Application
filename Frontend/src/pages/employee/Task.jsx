import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  History,
} from 'lucide-react';
import { taskApi, getCurrentUserInfo, taskTransformers } from '../../services/taskApi';
import DashboardHeader from "../../components/DashboardHeader";

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTasks();
  }, []);

  const fetchUserTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = await getCurrentUserInfo();
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      }

      const tasksData = await taskApi.getUserTasks(user?.email, user?.id);
      setTasks(taskTransformers.transformTasks(tasksData));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                status: newStatus.toLowerCase(),
                progress:
                  newStatus.toLowerCase() === 'completed'
                    ? 100
                    : newStatus.toLowerCase() === 'in progress'
                    ? 50
                    : 0,
              }
            : task
        )
      );
      
      setTimeout(() => fetchUserTasks(), 500);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + error.message);
      fetchUserTasks();
    }
  };

  const getStatusButtonConfig = (currentStatus) => {
    const status = currentStatus.toLowerCase();

    if (status === 'pending') {
      return {
        label: 'In Progress',
        nextStatus: 'In Progress',
        color: 'green',
        icon: <Clock className="w-4 h-4" />,
      };
    } else if (status === 'in progress') {
      return {
        label: 'Mark as Done',
        nextStatus: 'Completed',
        color: 'red',
        icon: <CheckCircle className="w-4 h-4" />,
      };
    } else if (status === 'completed') {
      return {
        label: 'Reopen Task',
        nextStatus: 'Pending',
        color: 'blue',
        icon: <Clock className="w-4 h-4" />,
      };
    }

    return {
      label: 'In Progress',
      nextStatus: 'In Progress',
      color: 'green',
      icon: <Clock className="w-4 h-4" />,
    };
  };

  const getButtonClasses = (color) => taskTransformers.getButtonClasses(color);
  const formatDate = (dateString) => taskTransformers.formatDate(dateString);
  const isOverdue = (deadline) => taskTransformers.isOverdue(deadline);
  const getPriorityColor = (priority) => taskTransformers.getPriorityColor(priority);
  const getStatusColor = (status) => taskTransformers.getStatusColor(status);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.milestone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignees.some((assignee) =>
        assignee.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="employee" activeItem="task" />
        <main className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tasks...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="employee" activeItem="task" />
      <div className="flex-1 flex flex-col overflow-hidden ">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 lg:mb-8">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Your Tasks</h1>
                {currentUser && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-sm lg:text-base text-gray-600">
                      Welcome back, {currentUser.name}! You have {tasks.length} task
                      {tasks.length !== 1 ? 's' : ''} assigned.
                    </p>
                    {currentUser.isTeamLeader && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        Team Leader
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {currentUser?.isTeamLeader && (
                    <button
                      onClick={() => navigate('/task-history')}
                      className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#087990] text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm lg:text-base"
                    >
                      <History className="w-4 lg:w-5 h-4 lg:h-5" />
                      <span className="hidden sm:inline">Task History</span>
                      <span className="sm:hidden">History</span>
                    </button>
                  )}
                  <button
                    onClick={() => fetchUserTasks()}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Refresh tasks"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-medium">Error loading tasks:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="max-w-7xl mx-auto">
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm ? 'No matching tasks found' : 'No tasks assigned'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : "You don't have any tasks assigned to you yet."}
                  </p>
                  <button
                    onClick={() => fetchUserTasks()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg inline-flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    const buttonConfig = getStatusButtonConfig(task.status);

                    return (
                      <div
                        key={task._id || task.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row">
                          <div className="lg:w-2 h-2 lg:h-auto bg-[#087990]" />
                          <div className="flex-1 p-4 lg:p-5">
                            <div className="flex justify-between items-start mb-3 lg:mb-4">
                              <div>
                                <h3 className="text-base lg:text-lg font-semibold text-gray-800">
                                  {task.title}
                                </h3>
                                <div className="mt-1 text-gray-600 text-sm">
                                  Milestone: {task.milestone}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-6 text-sm text-gray-700">
                              <div>
                                <strong>Deadline:</strong>{' '}
                                <span
                                  className={
                                    isOverdue(task.deadline)
                                      ? 'text-red-600 font-semibold'
                                      : ''
                                  }
                                >
                                  {formatDate(task.deadline)}
                                  {isOverdue(task.deadline) && ' (Overdue)'}
                                </span>
                              </div>
                              <div>
                                <strong>Priority:</strong>{' '}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority.charAt(0).toUpperCase() +
                                    task.priority.slice(1)}
                                </span>
                              </div>
                              <div>
                                <strong>Status:</strong>{' '}
                                <span
                                  className={`font-semibold ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {task.status.charAt(0).toUpperCase() +
                                    task.status.slice(1)}
                                </span>
                              </div>
                              <div>
                                <strong>Progress:</strong>{' '}
                                <span className="font-semibold text-blue-600">
                                  {task.progress}%
                                </span>
                              </div>
                              <div className="sm:col-span-2 lg:col-auto">
                                <strong>Assignees:</strong>{' '}
                                <span className="text-gray-800">
                                  {task.assignees.join(', ')}
                                </span>
                              </div>
                            </div>
                            {task.description && (
                              <div className="mt-3 text-sm text-gray-600">
                                {task.description.length > 150 ? (
                                  <>
                                    {task.description.substring(0, 150)}...
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/task-details/${task._id || task.id}`);
                                      }}
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                      Read more
                                    </button>
                                  </>
                                ) : (
                                  task.description
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-4 lg:p-5 lg:border-l border-gray-200 flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-3 lg:min-w-[200px] border-t lg:border-t-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(
                                  task._id || task.id,
                                  buttonConfig.nextStatus
                                );
                              }}
                              className={getButtonClasses(buttonConfig.color)}
                            >
                              {buttonConfig.icon}
                              <span className="hidden sm:inline">{buttonConfig.label}</span>
                              <span className="sm:hidden">
                                {buttonConfig.label.includes('Progress') ? 'Progress' : 
                                 buttonConfig.label.includes('Done') ? 'Done' : 
                                 buttonConfig.label.includes('Reopen') ? 'Reopen' : 
                                 buttonConfig.label}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/task-details/${task._id || task.id}`);
                              }}
                              className="py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-semibold border border-gray-300"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Task;