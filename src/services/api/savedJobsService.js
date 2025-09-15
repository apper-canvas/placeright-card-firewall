class SavedJobsService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'saved_job_c';
    this.currentUserId = 1; // Mock user ID - in real app this would come from auth context
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "job_id_c"}},
          {"field": {"Name": "user_id_c"}},
          {"field": {"Name": "saved_at_c"}},
          {"field": {"Name": "Tags"}}
        ],
        where: [
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching saved jobs: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const savedJobs = (response.data || []).map(saved => ({
        ...saved,
        jobId: saved.job_id_c?.Id || saved.job_id_c,
        userId: saved.user_id_c,
        savedAt: saved.saved_at_c
      }));

      return savedJobs;
    } catch (error) {
      console.error("Error fetching saved jobs:", error?.response?.data?.message || error);
      return [];
    }
  }

  async isSaved(jobId) {
    try {
      const params = {
        fields: [{"field": {"Name": "Name"}}],
        where: [
          {"FieldName": "job_id_c", "Operator": "EqualTo", "Values": [parseInt(jobId)]},
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      return response?.success && response?.data?.length > 0;
    } catch (error) {
      console.error("Error checking if job is saved:", error?.response?.data?.message || error);
      return false;
    }
  }

  async add(jobId) {
    try {
      // Check if already saved
      const isAlreadySaved = await this.isSaved(jobId);
      if (isAlreadySaved) {
        return false; // Already saved
      }

      const params = {
        records: [{
          Name: `Saved Job ${jobId}`,
          job_id_c: parseInt(jobId),
          user_id_c: this.currentUserId,
          saved_at_c: new Date().toISOString(),
          Tags: ''
        }]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to save ${failed.length} jobs:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error saving job:", error?.response?.data?.message || error);
      return false;
    }
  }

  async remove(jobId) {
    try {
      // First find the saved job record
      const params = {
        fields: [{"field": {"Name": "Name"}}],
        where: [
          {"FieldName": "job_id_c", "Operator": "EqualTo", "Values": [parseInt(jobId)]},
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success || !response?.data?.length) {
        return false; // Not found
      }

      const savedJobRecord = response.data[0];
      const deleteParams = { 
        RecordIds: [savedJobRecord.Id]
      };

      const deleteResponse = await this.apperClient.deleteRecord(this.tableName, deleteParams);

      if (!deleteResponse.success) {
        console.error(deleteResponse.message);
        return false;
      }

      if (deleteResponse.results) {
        const successful = deleteResponse.results.filter(r => r.success);
        return successful.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error removing saved job:", error?.response?.data?.message || error);
      return false;
    }
  }

  async toggle(jobId) {
    const isSaved = await this.isSaved(jobId);
    
    if (isSaved) {
      await this.remove(jobId);
      return false; // Now unsaved
    } else {
      await this.add(jobId);
      return true; // Now saved
    }
  }

  async getCount() {
    try {
      const params = {
        fields: [{"field": {"Name": "Name"}}],
        where: [
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      return response?.success ? (response.data?.length || 0) : 0;
    } catch (error) {
      console.error("Error getting saved jobs count:", error?.response?.data?.message || error);
      return 0;
    }
  }
}

export default new SavedJobsService();
