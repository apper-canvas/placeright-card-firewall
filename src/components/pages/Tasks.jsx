import { useState, useEffect } from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import taskService from "@/services/api/taskService";
import { toast } from "react-toastify";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const statusFilters = ['All', 'New', 'In Progress', 'Completed', 'Blocked'];

  useEffect(() => {
    loadTasks();
  }, [activeStatus]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await taskService.getAll({ 
        status: activeStatus 
      });
      setTasks(result || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    const result = await taskService.create(taskData);
    if (result) {
      setShowCreateForm(false);
      loadTasks();
    }
  };

  const handleEditTask = async (taskData) => {
    const result = await taskService.update(editingTask.Id, taskData);
    if (result) {
      setShowEditForm(false);
      setEditingTask(null);
      loadTasks();
    }
  };

  const handleDeleteTask = async (task) => {
    if (confirm(`Are you sure you want to delete "${task.title_c}"?`)) {
      const success = await taskService.delete(task.Id);
      if (success) {
        loadTasks();
      }
    }
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setShowEditForm(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDateString, status) => {
    if (!dueDateString || status === 'Completed') return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  if (loading) return <Loading message="Loading tasks..." />;
  if (error) return <Error message={error} onRetry={loadTasks} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your tasks and track progress</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <ApperIcon name="Plus" className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeStatus === status
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status}
              {status !== 'All' && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tasks.filter(t => t.status_c === status).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tasks Grid */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.Id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Task Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {task.title_c}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status_c)}`}>
                    {task.status_c}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditForm(task)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ApperIcon name="Edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task Description */}
              {task.description_c && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {task.description_c}
                </p>
              )}

              {/* Task Footer */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <ApperIcon name="Calendar" className="w-4 h-4 text-gray-400" />
                  <span className={`${isOverdue(task.due_date_c, task.status_c) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {formatDate(task.due_date_c)}
                  </span>
                </div>
                {task.Tags && (
                  <div className="flex items-center gap-1">
                    <ApperIcon name="Tag" className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{task.Tags}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="List"
          title="No tasks found"
          message={activeStatus === 'All' ? "Create your first task to get started" : `No tasks with status "${activeStatus}"`}
        />
      )}

      {/* Create Task Modal */}
      {showCreateForm && (
        <TaskFormModal
          title="Create New Task"
          onSubmit={handleCreateTask}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Task Modal */}
      {showEditForm && editingTask && (
        <TaskFormModal
          title="Edit Task"
          task={editingTask}
          onSubmit={handleEditTask}
          onClose={() => {
            setShowEditForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// Task Form Modal Component
const TaskFormModal = ({ title, task, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title_c: task?.title_c || '',
    description_c: task?.description_c || '',
    status_c: task?.status_c || 'New',
    due_date_c: task?.due_date_c ? task.due_date_c.split('T')[0] : '',
    Tags: task?.Tags || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = ['New', 'In Progress', 'Completed', 'Blocked'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title_c.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ApperIcon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title_c" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title_c"
              name="title_c"
              value={formData.title_c}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description_c" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description_c"
              name="description_c"
              value={formData.description_c}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter task description"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status_c" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status_c"
              name="status_c"
              value={formData.status_c}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due_date_c" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date_c"
              name="due_date_c"
              value={formData.due_date_c}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="Tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              id="Tags"
              name="Tags"
              value={formData.Tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter tags (comma-separated)"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-4 py-2"
            >
              {submitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;