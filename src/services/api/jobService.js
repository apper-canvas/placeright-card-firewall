import React from "react";
import Error from "@/components/ui/Error";
class JobService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'job_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "company_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "requirements_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "salary_range_c"}},
          {"field": {"Name": "type_c"}},
          {"field": {"Name": "posted_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching jobs: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const jobs = (response.data || []).map(job => ({
        ...job,
        title: job.title_c || job.Name || '',
        company: job.company_c || '',
        description: job.description_c || '',
        requirements: job.requirements_c || '',
        location: job.location_c || '',
        type: job.type_c || 'Full-time',
        status: job.status_c || 'Active',
        postedDate: job.posted_date_c,
        salaryRange: job.salary_range_c ? this.parseSalaryRange(job.salary_range_c) : { min: 0, max: 0 },
        applications: [] // Will be populated by application service if needed
      }));

      return jobs;
    } catch (error) {
      console.error("Error fetching jobs:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "company_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "requirements_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "salary_range_c"}},
          {"field": {"Name": "type_c"}},
          {"field": {"Name": "posted_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "Tags"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response?.data) {
        throw new Error("Job not found");
      }

      const job = response.data;
      
      // Transform data for UI compatibility
      return {
        ...job,
        title: job.title_c || job.Name || '',
        company: job.company_c || '',
        description: job.description_c || '',
        requirements: job.requirements_c || '',
        location: job.location_c || '',
        type: job.type_c || 'Full-time',
        status: job.status_c || 'Active',
        postedDate: job.posted_date_c,
        salaryRange: job.salary_range_c ? this.parseSalaryRange(job.salary_range_c) : { min: 0, max: 0 },
        applications: []
      };
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error?.response?.data?.message || error);
      throw new Error("Job not found");
    }
  }

  async create(jobData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Name: jobData.title_c || jobData.title || '',
          title_c: jobData.title_c || jobData.title || '',
          company_c: jobData.company_c || jobData.company || '',
          description_c: jobData.description_c || jobData.description || '',
          requirements_c: jobData.requirements_c || jobData.requirements || '',
          location_c: jobData.location_c || jobData.location || '',
          salary_range_c: jobData.salary_range_c || this.formatSalaryRange(jobData.salaryRange) || '',
          type_c: jobData.type_c || jobData.type || 'Full-time',
          posted_date_c: jobData.posted_date_c || jobData.postedDate || new Date().toISOString(),
          status_c: jobData.status_c || jobData.status || 'Active',
          Tags: jobData.Tags || ''
        }]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} jobs:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error creating job:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async update(id, jobData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Id: parseInt(id),
          Name: jobData.title_c || jobData.title,
          title_c: jobData.title_c || jobData.title,
          company_c: jobData.company_c || jobData.company,
          description_c: jobData.description_c || jobData.description,
          requirements_c: jobData.requirements_c || jobData.requirements,
          location_c: jobData.location_c || jobData.location,
          salary_range_c: jobData.salary_range_c || this.formatSalaryRange(jobData.salaryRange),
          type_c: jobData.type_c || jobData.type,
          posted_date_c: jobData.posted_date_c || jobData.postedDate,
          status_c: jobData.status_c || jobData.status,
          Tags: jobData.Tags
        }]
      };

      const response = await this.apperClient.updateRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} jobs:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error updating job:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const params = { 
        RecordIds: [parseInt(id)]
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} jobs:`, failed);
          failed.forEach(record => {
            if (record.message) console.error(record.message);
          });
        }
        
        return successful.length > 0;
      }
    } catch (error) {
      console.error("Error deleting job:", error?.response?.data?.message || error);
      return false;
    }
  }

  // Helper methods for data transformation
  parseSalaryRange(salaryStr) {
    if (!salaryStr) return { min: 0, max: 0 };
    try {
      // Try to parse as JSON first
      return JSON.parse(salaryStr);
    } catch {
      // Parse simple text formats like "50000-80000" or "$50,000 - $80,000"
      const cleanStr = salaryStr.replace(/[$,\s]/g, '');
      const parts = cleanStr.split('-');
      if (parts.length === 2) {
        return {
          min: parseInt(parts[0]) || 0,
          max: parseInt(parts[1]) || 0
        };
      }
      return { min: 0, max: 0 };
    }
  }

  formatSalaryRange(salaryRange) {
    if (!salaryRange) return '';
    if (typeof salaryRange === 'string') return salaryRange;
    return JSON.stringify(salaryRange);
  }
}

export default new JobService();