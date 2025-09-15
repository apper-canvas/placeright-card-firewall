class MessageService {
  constructor() {
    // Initialize ApperClient
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.messageTableName = 'message_c';
    this.conversationTableName = 'conversation_c';
  }

  async getConversations() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "participant_name_c"}},
          {"field": {"Name": "job_title_c"}},
          {"field": {"Name": "last_message_c"}},
          {"field": {"Name": "last_message_time_c"}},
          {"field": {"Name": "unread_count_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await this.apperClient.fetchRecords(this.conversationTableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching conversations: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const conversations = (response.data || []).map(conv => ({
        ...conv,
        participantName: conv.participant_name_c || '',
        jobTitle: conv.job_title_c || '',
        lastMessage: conv.last_message_c || '',
        lastMessageTime: conv.last_message_time_c,
        unreadCount: conv.unread_count_c || 0
      }));

      return conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getMessages(conversationId) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "conversation_id_c"}},
          {"field": {"Name": "sender_id_c"}},
          {"field": {"Name": "content_c"}},
          {"field": {"Name": "timestamp_c"}},
          {"field": {"Name": "read_c"}},
          {"field": {"Name": "Tags"}}
        ],
        where: [
          {"FieldName": "conversation_id_c", "Operator": "EqualTo", "Values": [parseInt(conversationId)]}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "ASC"}]
      };

      const response = await this.apperClient.fetchRecords(this.messageTableName, params);
      
      if (!response?.success) {
        console.error(`Error fetching messages: ${response?.message || 'Unknown error'}`);
        return [];
      }

      // Transform data for UI compatibility
      const messages = (response.data || []).map(msg => ({
        ...msg,
        conversationId: msg.conversation_id_c,
        senderId: msg.sender_id_c,
        content: msg.content_c || '',
        timestamp: msg.timestamp_c,
        read: msg.read_c || false
      }));

      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error?.response?.data?.message || error);
      return [];
    }
  }

  async create(messageData) {
    try {
      // Only include Updateable fields
      const params = {
        records: [{
          Name: `Message ${Date.now()}`,
          conversation_id_c: parseInt(messageData.conversationId),
          sender_id_c: parseInt(messageData.senderId),
          content_c: messageData.content || '',
          timestamp_c: messageData.timestamp || new Date().toISOString(),
          read_c: messageData.read || false,
          Tags: messageData.Tags || ''
        }]
      };

      const response = await this.apperClient.createRecord(this.messageTableName, params);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      let createdMessage = null;
      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} messages:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => console.error(`${error.fieldLabel}: ${error}`));
          });
        }
        
        createdMessage = successful.length > 0 ? successful[0].data : null;
      }

      // Update conversation last message
      if (createdMessage) {
        await this.updateConversationLastMessage(
          parseInt(messageData.conversationId),
          messageData.content,
          messageData.timestamp || new Date().toISOString()
        );

        // Transform for UI compatibility
        return {
          ...createdMessage,
          conversationId: createdMessage.conversation_id_c,
          senderId: createdMessage.sender_id_c,
          content: createdMessage.content_c,
          timestamp: createdMessage.timestamp_c,
          read: createdMessage.read_c
        };
      }

      return null;
    } catch (error) {
      console.error("Error creating message:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async markAsRead(messageId) {
    try {
      const params = {
        records: [{
          Id: parseInt(messageId),
          read_c: true
        }]
      };

      const response = await this.apperClient.updateRecord(this.messageTableName, params);

      if (!response.success) {
        console.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        return successful.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error marking message as read:", error?.response?.data?.message || error);
      return false;
    }
  }

  // Helper method to update conversation last message
  async updateConversationLastMessage(conversationId, lastMessage, lastMessageTime) {
    try {
      const params = {
        records: [{
          Id: conversationId,
          last_message_c: lastMessage,
          last_message_time_c: lastMessageTime
        }]
      };

      const response = await this.apperClient.updateRecord(this.conversationTableName, params);
      
      if (!response.success) {
        console.error("Error updating conversation last message:", response.message);
      }
    } catch (error) {
      console.error("Error updating conversation last message:", error?.response?.data?.message || error);
    }
  }
}

export default new MessageService();