class SavedCandidatesService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'saved_candidate_c';
    this.currentUserId = 1; // Mock user ID - in real app this would come from auth context
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_id_c"}},
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
        console.error(`Error fetching saved candidates: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const savedCandidates = (response.data || []).map(saved => ({
        ...saved,
        candidateId: saved.candidate_id_c?.Id || saved.candidate_id_c,
        userId: saved.user_id_c,
        savedAt: saved.saved_at_c
      }));

      return savedCandidates;
    } catch (error) {
      console.error("Error fetching saved candidates:", error?.response?.data?.message || error);
      return [];
    }
  }

  async add(candidateId) {
    try {
      // Check if already saved
      const isAlreadySaved = await this.checkSaved(candidateId);
      if (isAlreadySaved) {
        throw new Error("Candidate is already saved");
      }

      const params = {
        records: [{
          Name: `Saved Candidate ${candidateId}`,
          candidate_id_c: parseInt(candidateId),
          user_id_c: this.currentUserId,
          saved_at_c: new Date().toISOString(),
          Tags: ''
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
          console.error(`Failed to save ${failed.length} candidates:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error saving candidate:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async remove(candidateId) {
    try {
      // First find the saved candidate record
      const params = {
        fields: [{"field": {"Name": "Name"}}],
        where: [
          {"FieldName": "candidate_id_c", "Operator": "EqualTo", "Values": [parseInt(candidateId)]},
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success || !response?.data?.length) {
        throw new Error("Saved candidate not found");
      }

      const savedCandidateRecord = response.data[0];
      const deleteParams = { 
        RecordIds: [savedCandidateRecord.Id]
      };

      const deleteResponse = await this.apperClient.deleteRecord(this.tableName, deleteParams);

      if (!deleteResponse.success) {
        console.error(deleteResponse.message);
        throw new Error(deleteResponse.message);
      }

      if (deleteResponse.results) {
        const successful = deleteResponse.results.filter(r => r.success);
        return successful.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error removing saved candidate:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async checkSaved(candidateId) {
    try {
      const params = {
        fields: [{"field": {"Name": "Name"}}],
        where: [
          {"FieldName": "candidate_id_c", "Operator": "EqualTo", "Values": [parseInt(candidateId)]},
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      return response?.success && response?.data?.length > 0;
    } catch (error) {
      console.error("Error checking if candidate is saved:", error?.response?.data?.message || error);
      return false;
    }
  }

  async getByCandidateId(candidateId) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_id_c"}},
          {"field": {"Name": "user_id_c"}},
          {"field": {"Name": "saved_at_c"}}
        ],
        where: [
          {"FieldName": "candidate_id_c", "Operator": "EqualTo", "Values": [parseInt(candidateId)]},
          {"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [this.currentUserId]}
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (response?.success && response?.data?.length > 0) {
        const saved = response.data[0];
        return {
          ...saved,
          candidateId: saved.candidate_id_c?.Id || saved.candidate_id_c,
          userId: saved.user_id_c,
          savedAt: saved.saved_at_c
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching saved candidate:", error?.response?.data?.message || error);
      return null;
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
      console.error("Error getting saved candidates count:", error?.response?.data?.message || error);
      return 0;
    }
  }
}

export default new SavedCandidatesService();