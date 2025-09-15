class ContactUsService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'contact_us_c';
  }

  async create(contactData) {
    try {
      // Only include Updateable fields based on table schema
      const params = {
        records: [{
          Name: `Contact from ${contactData.name}`,
          name_c: contactData.name || '',
          email_c: contactData.email || '',
          subject_c: contactData.subject || '',
          message_c: contactData.message || '',
          Tags: 'contact-form'
        }]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      let createdContact = null;
      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} contact submissions:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
            if (record.message) console.error(record.message);
          });
        }
        
        createdContact = successful.length > 0 ? successful[0].data : null;
      }

      return createdContact;
    } catch (error) {
      console.error("Error creating contact submission:", error?.response?.data?.message || error);
      throw error;
    }
  }
}

export default new ContactUsService();