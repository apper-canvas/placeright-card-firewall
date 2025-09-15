class CandidateService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'candidate_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "skills_c"}},
          {"field": {"Name": "experience_c"}},
          {"field": {"Name": "education_c"}},
          {"field": {"Name": "resume_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "preferences_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching candidates: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const candidates = (response.data || []).map(candidate => ({
        ...candidate,
        name: candidate.name_c || candidate.Name || '',
        email: candidate.email_c || '',
        phone: candidate.phone_c || '',
        location: candidate.location_c || '',
        description: candidate.description_c || '',
        skills: candidate.skills_c ? candidate.skills_c.split(',').map(s => s.trim()) : [],
        experience: candidate.experience_c ? this.parseExperience(candidate.experience_c) : []
      }));

      return candidates;
    } catch (error) {
      console.error("Error fetching candidates:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "skills_c"}},
          {"field": {"Name": "experience_c"}},
          {"field": {"Name": "education_c"}},
          {"field": {"Name": "resume_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "preferences_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "Tags"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response?.data) {
        throw new Error("Candidate not found");
      }

      const candidate = response.data;
      
      // Transform data for UI compatibility
      return {
        ...candidate,
        name: candidate.name_c || candidate.Name || '',
        email: candidate.email_c || '',
        phone: candidate.phone_c || '',
        location: candidate.location_c || '',
        description: candidate.description_c || '',
        skills: candidate.skills_c ? candidate.skills_c.split(',').map(s => s.trim()) : [],
        experience: candidate.experience_c ? this.parseExperience(candidate.experience_c) : []
      };
    } catch (error) {
      console.error(`Error fetching candidate ${id}:`, error?.response?.data?.message || error);
      throw new Error("Candidate not found");
    }
  }

  async create(candidateData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Name: candidateData.name_c || candidateData.name || '',
          name_c: candidateData.name_c || candidateData.name || '',
          email_c: candidateData.email_c || candidateData.email || '',
          phone_c: candidateData.phone_c || candidateData.phone || '',
          skills_c: Array.isArray(candidateData.skills) ? candidateData.skills.join(',') : (candidateData.skills_c || ''),
          experience_c: candidateData.experience_c || this.formatExperience(candidateData.experience) || '',
          education_c: candidateData.education_c || '',
          resume_c: candidateData.resume_c || '',
          location_c: candidateData.location_c || candidateData.location || '',
          preferences_c: candidateData.preferences_c || '',
          description_c: candidateData.description_c || candidateData.description || '',
          Tags: candidateData.Tags || ''
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
          console.error(`Failed to create ${failed.length} candidates:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error creating candidate:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async update(id, candidateData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Id: parseInt(id),
          Name: candidateData.name_c || candidateData.name,
          name_c: candidateData.name_c || candidateData.name,
          email_c: candidateData.email_c || candidateData.email,
          phone_c: candidateData.phone_c || candidateData.phone,
          skills_c: Array.isArray(candidateData.skills) ? candidateData.skills.join(',') : candidateData.skills_c,
          experience_c: candidateData.experience_c || this.formatExperience(candidateData.experience),
          education_c: candidateData.education_c,
          resume_c: candidateData.resume_c,
          location_c: candidateData.location_c || candidateData.location,
          preferences_c: candidateData.preferences_c,
          description_c: candidateData.description_c || candidateData.description,
          Tags: candidateData.Tags
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
          console.error(`Failed to update ${failed.length} candidates:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        return successful.length > 0 ? successful[0].data : null;
      }
    } catch (error) {
      console.error("Error updating candidate:", error?.response?.data?.message || error);
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
          console.error(`Failed to delete ${failed.length} candidates:`, failed);
          failed.forEach(record => {
            if (record.message) console.error(record.message);
          });
        }
        
        return successful.length > 0;
      }
    } catch (error) {
      console.error("Error deleting candidate:", error?.response?.data?.message || error);
      return false;
    }
  }

  // Helper methods for data transformation
  parseExperience(experienceStr) {
    if (!experienceStr) return [];
    try {
      // Try to parse as JSON first, fallback to simple text parsing
      return JSON.parse(experienceStr);
    } catch {
      // Simple text parsing - split by lines and create basic objects
      return experienceStr.split('\n').filter(line => line.trim()).map(line => ({
        position: line.trim(),
        company: '',
        duration: 1
      }));
    }
  }

  formatExperience(experience) {
    if (!experience) return '';
    if (typeof experience === 'string') return experience;
    return JSON.stringify(experience);
  }
}

export default new CandidateService();
