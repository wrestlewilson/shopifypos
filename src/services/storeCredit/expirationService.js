import { createAuthenticatedClient } from '../shopify/auth';

// Utility function to check if a credit is expiring soon
const isExpiringSoon = (expiryDate, daysThreshold = 30) => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const timeDiff = expiry.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff > 0 && daysDiff <= daysThreshold;
};

// Service to handle store credit expiration
class StoreCreditExpirationService {
  constructor() {
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Get all expiring credits within the threshold period
  async getExpiringCredits(daysThreshold = 30) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(`/api/store-credit/expiring?days=${daysThreshold}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring credits:', error);
      throw error;
    }
  }
  
  // Send expiration notifications to customers
  async sendExpirationNotifications(daysThreshold = 30) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/store-credit/send-expiration-notifications', {
        daysThreshold
      });
      return response.data;
    } catch (error) {
      console.error('Error sending expiration notifications:', error);
      throw error;
    }
  }
  
  // Extend credit expiration date
  async extendCreditExpiration(creditId, newExpiryDate) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.put(`/api/store-credit/${creditId}/extend`, {
        newExpiryDate
      });
      return response.data;
    } catch (error) {
      console.error('Error extending credit expiration:', error);
      throw error;
    }
  }
  
  // Process expired credits (mark as expired and notify customers)
  async processExpiredCredits() {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/store-credit/process-expired');
      return response.data;
    } catch (error) {
      console.error('Error processing expired credits:', error);
      throw error;
    }
  }
  
  // Get a customer's expiring credits
  async getCustomerExpiringCredits(customerId, daysThreshold = 30) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(
        `/api/customers/${customerId}/credit/expiring?days=${daysThreshold}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer expiring credits:', error);
      throw error;
    }
  }
}

// Scheduled job to handle credit expirations
const scheduleCreditExpirationJobs = () => {
  // Daily job to process expired credits
  const processExpiredCreditsJob = async () => {
    const service = new StoreCreditExpirationService();
    try {
      console.log('Running daily expired credits processing job');
      await service.processExpiredCredits();
      console.log('Expired credits processing completed');
    } catch (error) {
      console.error('Error in expired credits processing job:', error);
    }
  };
  
  // Weekly job to send expiration notifications
  const sendExpirationNotificationsJob = async () => {
    const service = new StoreCreditExpirationService();
    try {
      console.log('Running weekly expiration notifications job');
      await service.sendExpirationNotifications(30); // 30 days notification
      console.log('Expiration notifications sent');
    } catch (error) {
      console.error('Error in expiration notifications job:', error);
    }
  };
  
  // Schedule the jobs (this is a simplified example)
  // In a real application, you would use a proper job scheduler like node-cron
  
  // Run expired credits processing daily at midnight
  const scheduleProcessingJob = () => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      0, 0, 0 // midnight
    );
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      processExpiredCreditsJob();
      // Reschedule for the next day
      scheduleProcessingJob();
    }, timeUntilMidnight);
  };
  
  // Run expiration notifications weekly on Sunday at midnight
  const scheduleNotificationsJob = () => {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    const nextSunday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSunday,
      0, 0, 0 // midnight
    );
    const timeUntilSunday = nextSunday.getTime() - now.getTime();
    
    setTimeout(() => {
      sendExpirationNotificationsJob();
      // Reschedule for the next week
      scheduleNotificationsJob();
    }, timeUntilSunday);
  };
  
  // Start the scheduling
  scheduleProcessingJob();
  scheduleNotificationsJob();
  
  // Also run immediately on application startup
  processExpiredCreditsJob();
};

export { 
  StoreCreditExpirationService, 
  scheduleCreditExpirationJobs, 
  isExpiringSoon 
}; 