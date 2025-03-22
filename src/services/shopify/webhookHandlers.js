import crypto from 'crypto';

// Webhook verification middleware
const verifyShopifyWebhook = (req, res, next) => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const shopifyDomain = req.headers['x-shopify-shop-domain'];
  const webhookTopic = req.headers['x-shopify-topic'];
  
  // Verify the webhook is from Shopify
  const rawBody = JSON.stringify(req.body);
  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
    
  if (generatedHash !== hmacHeader) {
    console.error('Webhook verification failed');
    return res.status(401).send('Webhook verification failed');
  }
  
  console.log(`Verified webhook from ${shopifyDomain} for topic: ${webhookTopic}`);
  next();
};

// Product update webhook handler
const handleProductUpdateWebhook = async (req, res) => {
  try {
    const productData = req.body;
    console.log('Product update webhook received:', productData.id);
    
    // Process the product update
    await processProductUpdate(productData);
    
    res.status(200).send('Product update processed');
  } catch (error) {
    console.error('Error processing product update webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Order creation webhook handler
const handleOrderCreationWebhook = async (req, res) => {
  try {
    const orderData = req.body;
    console.log('Order creation webhook received:', orderData.id);
    
    // Process the new order
    await processNewOrder(orderData);
    
    res.status(200).send('Order creation processed');
  } catch (error) {
    console.error('Error processing order creation webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Customer update webhook handler
const handleCustomerUpdateWebhook = async (req, res) => {
  try {
    const customerData = req.body;
    console.log('Customer update webhook received:', customerData.id);
    
    // Process the customer update
    await processCustomerUpdate(customerData);
    
    res.status(200).send('Customer update processed');
  } catch (error) {
    console.error('Error processing customer update webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Inventory level update webhook handler
const handleInventoryUpdateWebhook = async (req, res) => {
  try {
    const inventoryData = req.body;
    console.log('Inventory update webhook received for item:', inventoryData.inventory_item_id);
    
    // Process the inventory update
    await processInventoryUpdate(inventoryData);
    
    res.status(200).send('Inventory update processed');
  } catch (error) {
    console.error('Error processing inventory update webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Helper functions for processing webhook data
const processProductUpdate = async (productData) => {
  // Implementation for processing product updates
  // This would update local database with new product information
};

const processNewOrder = async (orderData) => {
  // Implementation for processing new orders
  // This would create a new transaction record in the local system
};

const processCustomerUpdate = async (customerData) => {
  // Implementation for processing customer updates
  // This would update customer information in the local database
};

const processInventoryUpdate = async (inventoryData) => {
  // Implementation for processing inventory updates
  // This would update local inventory records
};

export {
  verifyShopifyWebhook,
  handleProductUpdateWebhook,
  handleOrderCreationWebhook,
  handleCustomerUpdateWebhook,
  handleInventoryUpdateWebhook
}; 