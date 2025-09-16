// Task service for managing tasks with ApperClient integration
import { toast } from 'react-toastify';

class TaskService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'task_c';
  }

  // Get all tasks
  async getAll(filters = {}) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "due_date_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        orderBy: [{"fieldName": "due_date_c", "sorttype": "ASC"}]
      };

      // Add status filter if provided
      if (filters.status && filters.status !== 'All') {
        params.where = [
          {"FieldName": "status_c", "Operator": "ExactMatch", "Values": [filters.status]}
        ];
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error('Failed to fetch tasks:', response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error?.response?.data?.message || error.message);
      toast.error('Failed to load tasks');
      return [];
    }
  }

  // Get task by ID
  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "due_date_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error('Failed to fetch task:', response.message);
        toast.error(response.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error?.response?.data?.message || error.message);
      toast.error('Failed to load task');
      return null;
    }
  }

  // Create new task
  async create(taskData) {
    try {
      // Only include updateable fields
      const payload = {
        records: [{
          Name: taskData.Name || taskData.title_c,
          Tags: taskData.Tags || '',
          title_c: taskData.title_c,
          description_c: taskData.description_c || '',
          status_c: taskData.status_c || 'New',
          due_date_c: taskData.due_date_c
        }]
      };

      const response = await this.apperClient.createRecord(this.tableName, payload);
      
      if (!response.success) {
        console.error('Failed to create task:', response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} tasks:`, failed);
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => {
                toast.error(`${error.fieldLabel}: ${error.message}`);
              });
            }
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successful.length > 0) {
          toast.success('Task created successfully');
          return successful[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error creating task:', error?.response?.data?.message || error.message);
      toast.error('Failed to create task');
      return null;
    }
  }

  // Update task
  async update(id, taskData) {
    try {
      // Only include updateable fields
      const payload = {
        records: [{
          Id: parseInt(id),
          Name: taskData.Name || taskData.title_c,
          Tags: taskData.Tags || '',
          title_c: taskData.title_c,
          description_c: taskData.description_c || '',
          status_c: taskData.status_c,
          due_date_c: taskData.due_date_c
        }]
      };

      const response = await this.apperClient.updateRecord(this.tableName, payload);
      
      if (!response.success) {
        console.error('Failed to update task:', response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} tasks:`, failed);
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => {
                toast.error(`${error.fieldLabel}: ${error.message}`);
              });
            }
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successful.length > 0) {
          toast.success('Task updated successfully');
          return successful[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error updating task:', error?.response?.data?.message || error.message);
      toast.error('Failed to update task');
      return null;
    }
  }

  // Delete task
  async delete(id) {
    try {
      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);
      
      if (!response.success) {
        console.error('Failed to delete task:', response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} tasks:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successful.length > 0) {
          toast.success('Task deleted successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error deleting task:', error?.response?.data?.message || error.message);
      toast.error('Failed to delete task');
      return false;
    }
  }

  // Get task statistics
  async getStats() {
    try {
      const tasks = await this.getAll();
      
      const stats = {
        total: tasks.length,
        new: tasks.filter(t => t.status_c === 'New').length,
        inProgress: tasks.filter(t => t.status_c === 'In Progress').length,
        completed: tasks.filter(t => t.status_c === 'Completed').length,
        blocked: tasks.filter(t => t.status_c === 'Blocked').length,
        overdue: tasks.filter(t => {
          if (!t.due_date_c) return false;
          const dueDate = new Date(t.due_date_c);
          const today = new Date();
          return dueDate < today && t.status_c !== 'Completed';
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return {
        total: 0,
        new: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
        overdue: 0
      };
    }
  }
}

export default new TaskService();