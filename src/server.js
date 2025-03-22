import express from 'express';
import dotenv from 'dotenv';
import {
  verifyShopifyWebhook,
  handleProductUpdateWebhook,
  handleOrderCreationWebhook,
  handleCustomerUpdateWebhook,
  handleInventoryUpdateWebhook
} from './services/shopify/webhookHandlers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Webhook routes
app.post('/webhooks/products/update', verifyShopifyWebhook, handleProductUpdateWebhook);
app.post('/webhooks/orders/create', verifyShopifyWebhook, handleOrderCreationWebhook);
app.post('/webhooks/customers/update', verifyShopifyWebhook, handleCustomerUpdateWebhook);
app.post('/webhooks/inventory/update', verifyShopifyWebhook, handleInventoryUpdateWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 