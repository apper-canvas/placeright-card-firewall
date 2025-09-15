class ApplicationService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'application_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "job_id_c"}},
          {"field": {"Name": "candidate_id_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "applied_date_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "notes_c"}},
          {"field": {"Name": "interviews_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching applications: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const applications = (response.data || []).map(app => ({
        ...app,
        jobId: app.job_id_c?.Id || app.job_id_c,
        candidateId: app.candidate_id_c?.Id || app.candidate_id_c,
        status: app.status_c || 'Applied',
        appliedDate: app.applied_date_c,
        coverLetter: app.cover_letter_c || '',
        notes: app.notes_c || '',
        interviews: app.interviews_c ? this.parseInterviews(app.interviews_c) : []
      }));

      return applications;
    } catch (error) {
      console.error("Error fetching applications:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "job_id_c"}},
          {"field": {"Name": "candidate_id_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "applied_date_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "notes_c"}},
          {"field": {"Name": "interviews_c"}},
          {"field": {"Name": "Tags"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response?.data) {
        throw new Error("Application not found");
      }

      const app = response.data;
      
      // Transform data for UI compatibility
      return {
        ...app,
        jobId: app.job_id_c?.Id || app.job_id_c,
        candidateId: app.candidate_id_c?.Id || app.candidate_id_c,
        status: app.status_c || 'Applied',
        appliedDate: app.applied_date_c,
        coverLetter: app.cover_letter_c || '',
        notes: app.notes_c || '',
        interviews: app.interviews_c ? this.parseInterviews(app.interviews_c) : []
      };
    } catch (error) {
      console.error(`Error fetching application ${id}:`, error?.response?.data?.message || error);
      throw new Error("Application not found");
    }
  }

  async create(applicationData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Name: applicationData.Name || `Application for ${applicationData.jobId}`,
          job_id_c: parseInt(applicationData.jobId) || parseInt(applicationData.job_id_c),
          candidate_id_c: parseInt(applicationData.candidateId) || parseInt(applicationData.candidate_id_c),
          status_c: applicationData.status || applicationData.status_c || 'Applied',
          applied_date_c: applicationData.appliedDate || applicationData.applied_date_c || new Date().toISOString(),
          cover_letter_c: applicationData.coverLetter || applicationData.cover_letter_c || '',
          notes_c: applicationData.notes || applicationData.notes_c || '',
          interviews_c: applicationData.interviews ? this.formatInterviews(applicationData.interviews) : (applicationData.interviews_c || ''),
          Tags: applicationData.Tags || ''
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
          console.error(`Failed to create ${failed.length} applications:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error creating application:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async update(id, applicationData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Id: parseInt(id),
          Name: applicationData.Name || `Application for ${applicationData.jobId}`,
          job_id_c: parseInt(applicationData.jobId) || parseInt(applicationData.job_id_c),
          candidate_id_c: parseInt(applicationData.candidateId) || parseInt(applicationData.candidate_id_c),
          status_c: applicationData.status || applicationData.status_c,
          applied_date_c: applicationData.appliedDate || applicationData.applied_date_c,
          cover_letter_c: applicationData.coverLetter || applicationData.cover_letter_c,
          notes_c: applicationData.notes || applicationData.notes_c,
          interviews_c: applicationData.interviews ? this.formatInterviews(applicationData.interviews) : applicationData.interviews_c,
          Tags: applicationData.Tags
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
          console.error(`Failed to update ${failed.length} applications:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error updating application:", error?.response?.data?.message || error);
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
          console.error(`Failed to delete ${failed.length} applications:`, failed);
          failed.forEach(record => {
            if (record.message) console.error(record.message);
          });
        }
        
        return successful.length > 0;
      }
    } catch (error) {
      console.error("Error deleting application:", error?.response?.data?.message || error);
      return false;
    }
  }

  // Helper methods for data transformation
  parseInterviews(interviewsStr) {
    if (!interviewsStr) return [];
    try {
      return JSON.parse(interviewsStr);
    } catch {
      // Simple text parsing - split by lines
      return interviewsStr.split('\n').filter(line => line.trim()).map(line => ({
        date: '',
        type: 'Interview',
        notes: line.trim()
      }));
    }
  }

  formatInterviews(interviews) {
    if (!interviews) return '';
    if (typeof interviews === 'string') return interviews;
    return JSON.stringify(interviews);
  }
}

export default new ApplicationService();

export default new ApplicationService();