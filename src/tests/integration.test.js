import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TransactionWidget } from '../components/transactions/TransactionWidget';
import { CustomerProfile } from '../components/customer/CustomerProfile';
import { ReportingDashboard } from '../components/reports/ReportingDashboard';
import { ShopifySyncService } from '../services/shopify/ShopifySyncService';

// Create axios mock
const mockAxios = new MockAdapter(axios);

// Mock the authenticated client
jest.mock('../services/shopify/auth', () => ({
  createAuthenticatedClient: jest.fn().mockResolvedValue(axios)
}));

// Transaction Widget Integration Tests
describe('TransactionWidget Integration', () => {
  // Sample data
  const mockCustomers = [
    { 
      _id: '1', 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'john@example.com', 
      storeCredit: { balance: 50 } 
    },
    { 
      _id: '2', 
      firstName: 'Jane', 
      lastName: 'Smith', 
      email: 'jane@example.com', 
      storeCredit: { balance: 25 } 
    }
  ];
  
  const mockTransaction = {
    _id: 'txn123',
    type: 'buy',
    status: 'completed',
    customer: mockCustomers[0],
    items: [
      { name: 'Vintage Record', price: 15.99, quantity: 2, total: 31.98 }
    ],
    payments: [
      { method: 'cash', amount: 31.98 }
    ],
    subtotal: 31.98,
    tax: 0,
    total: 31.98,
    date: new Date().toISOString()
  };
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });
  
  test('completes a full buy transaction flow', async () => {
    // Mock customer search API
    mockAxios.onGet('/api/customers/search').reply(200, {
      customers: mockCustomers,
      totalPages: 1,
      currentPage: 1,
      totalItems: 2
    });
    
    // Mock transaction creation API
    mockAxios.onPost('/api/transactions').reply(200, mockTransaction);
    
    // Mock store credit update API
    mockAxios.onPut('/api/customers/1/store-credit').reply(200, {
      success: true,
      balance: 50
    });
    
    // Render the transaction widget
    render(
      <BrowserRouter>
        <AuthProvider>
          <TransactionWidget />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Step 1: Select transaction type
    expect(screen.getByText(/select transaction type/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/buy from customer/i));
    
    // Step 2: Search for customer
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Select customer
    fireEvent.click(screen.getByText('John Doe'));
    
    // Step 3: Fill transaction form
    await waitFor(() => {
      expect(screen.getByText(/buy transaction/i)).toBeInTheDocument();
    });
    
    // Add an item
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Vintage Record' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '15.99' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Select payment method
    fireEvent.change(screen.getByLabelText(/payment method/i), { target: { value: 'cash' } });
    
    // Complete transaction
    fireEvent.click(screen.getByRole('button', { name: /complete transaction/i }));
    
    // Step 4: Verify transaction completion
    await waitFor(() => {
      expect(screen.getByText(/transaction completed successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/transaction id: txn123/i)).toBeInTheDocument();
    });
    
    // Verify API calls
    expect(mockAxios.history.get.length).toBe(1); // Customer search
    expect(mockAxios.history.post.length).toBe(1); // Transaction creation
    
    // Verify transaction data sent to API
    const transactionData = JSON.parse(mockAxios.history.post[0].data);
    expect(transactionData.type).toBe('buy');
    expect(transactionData.customer).toBe('1');
    expect(transactionData.items.length).toBe(1);
    expect(transactionData.items[0].name).toBe('Vintage Record');
  });
  
  test('handles customer not found scenario', async () => {
    // Mock empty customer search results
    mockAxios.onGet('/api/customers/search').reply(200, {
      customers: [],
      totalPages: 0,
      currentPage: 1,
      totalItems: 0
    });
    
    // Render the transaction widget
    render(
      <BrowserRouter>
        <AuthProvider>
          <TransactionWidget />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Select transaction type
    fireEvent.click(screen.getByText(/buy from customer/i));
    
    // Search for non-existent customer
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'NonExistent' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Verify no results message
    await waitFor(() => {
      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    });
    
    // Verify create new customer option is displayed
    expect(screen.getByText(/create new customer/i)).toBeInTheDocument();
  });
  
  test('handles API errors gracefully', async () => {
    // Mock customer search API success
    mockAxios.onGet('/api/customers/search').reply(200, {
      customers: mockCustomers,
      totalPages: 1,
      currentPage: 1,
      totalItems: 2
    });
    
    // Mock transaction creation API failure
    mockAxios.onPost('/api/transactions').reply(500, {
      error: 'Internal server error'
    });
    
    // Render the transaction widget
    render(
      <BrowserRouter>
        <AuthProvider>
          <TransactionWidget />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Select transaction type
    fireEvent.click(screen.getByText(/buy from customer/i));
    
    // Search for customer
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Select customer
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('John Doe'));
    
    // Fill transaction form
    await waitFor(() => {
      expect(screen.getByText(/buy transaction/i)).toBeInTheDocument();
    });
    
    // Add an item
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Vintage Record' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '15.99' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Select payment method
    fireEvent.change(screen.getByLabelText(/payment method/i), { target: { value: 'cash' } });
    
    // Complete transaction
    fireEvent.click(screen.getByRole('button', { name: /complete transaction/i }));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/error processing transaction/i)).toBeInTheDocument();
    });
  });
});

// Customer Profile Integration Tests
describe('CustomerProfile Integration', () => {
  const mockCustomer = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    storeCredit: {
      balance: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    notes: 'Frequent buyer',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const mockTransactions = [
    {
      _id: 'txn1',
      type: 'buy',
      status: 'completed',
      items: [{ name: 'Vintage Record', price: 15.99, quantity: 2, total: 31.98 }],
      total: 31.98,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'txn2',
      type: 'sell',
      status: 'completed',
      items: [{ name: 'Retro Game', price: 25.99, quantity: 1, total: 25.99 }],
      total: 25.99,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  const mockCreditHistory = [
    {
      _id: 'crd1',
      type: 'add',
      amount: 50,
      balanceAfter: 50,
      description: 'Initial credit',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    
    // Mock customer API
    mockAxios.onGet('/api/customers/1').reply(200, mockCustomer);
    
    // Mock transactions API
    mockAxios.onGet('/api/customers/1/transactions').reply(200, {
      transactions: mockTransactions,
      totalPages: 1,
      currentPage: 1,
      totalItems: 2
    });
    
    // Mock credit history API
    mockAxios.onGet('/api/customers/1/store-credit/history').reply(200, {
      transactions: mockCreditHistory,
      totalPages: 1,
      currentPage: 1,
      totalItems: 1
    });
    
    // Mock customer update API
    mockAxios.onPut('/api/customers/1').reply(200, {
      ...mockCustomer,
      notes: 'Updated notes'
    });
  });
  
  test('loads and displays customer profile data', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerProfile customerId="1" />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for customer data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Verify customer details are displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-123-4567')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Store Credit: $50.00')).toBeInTheDocument();
    
    // Verify transaction history is displayed
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText('Vintage Record')).toBeInTheDocument();
    expect(screen.getByText('Retro Game')).toBeInTheDocument();
    
    // Verify credit history is displayed
    expect(screen.getByText('Credit History')).toBeInTheDocument();
    expect(screen.getByText('Initial credit')).toBeInTheDocument();
  });
  
  test('allows editing customer information', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerProfile customerId="1" />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for customer data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Click edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    // Update notes field
    const notesField = screen.getByLabelText(/notes/i);
    fireEvent.change(notesField, { target: { value: 'Updated notes' } });
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify API call
    await waitFor(() => {
      expect(mockAxios.history.put.length).toBe(1);
      const updateData = JSON.parse(mockAxios.history.put[0].data);
      expect(updateData.notes).toBe('Updated notes');
    });
    
    // Verify success message
    expect(screen.getByText(/customer updated successfully/i)).toBeInTheDocument();
  });
  
  test('handles API errors when loading profile', async () => {
    // Override mock to simulate error
    mockAxios.reset();
    mockAxios.onGet('/api/customers/1').reply(500, { error: 'Server error' });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerProfile customerId="1" />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/error loading customer profile/i)).toBeInTheDocument();
    });
  });
});

// Shopify Sync Integration Tests
describe('ShopifySyncService Integration', () => {
  const mockShopifyCustomers = [
    {
      id: 101,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      default_address: {
        address1: '123 Main St',
        city: 'Anytown',
        province: 'CA',
        zip: '12345',
        country: 'USA'
      }
    },
    {
      id: 102,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '555-987-6543',
      default_address: {
        address1: '456 Oak Ave',
        city: 'Somewhere',
        province: 'NY',
        zip: '67890',
        country: 'USA'
      }
    }
  ];
  
  const mockShopifyOrders = [
    {
      id: 1001,
      customer: { id: 101 },
      line_items: [
        { name: 'Product 1', sku: 'SKU1', price: '19.99', quantity: 2, tax_lines: [] }
      ],
      financial_status: 'paid',
      subtotal_price: '39.98',
      total_tax: '0.00',
      total_discounts: '0.00',
      total_price: '39.98',
      created_at: new Date().toISOString()
    }
  ];
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    
    // Mock Shopify API endpoints
    mockAxios.onGet('/api/shopify/customers').reply(200, {
      customers: mockShopifyCustomers
    });
    
    mockAxios.onGet('/api/shopify/orders').reply(200, {
      orders: mockShopifyOrders
    });
    
    // Mock database operations
    jest.spyOn(ShopifySyncService.prototype, 'initialize').mockResolvedValue();
    
    const mockCustomerDAO = {
      getCustomerByShopifyId: jest.fn().mockResolvedValue(null),
      createCustomer: jest.fn().mockResolvedValue({ _id: 'cust1' }),
      updateCustomer: jest.fn().mockResolvedValue({ _id: 'cust1' })
    };
    
    const mockTransactionDAO = {
      getTransactionByShopifyOrderId: jest.fn().mockResolvedValue(null),
      createTransaction: jest.fn().mockResolvedValue({ _id: 'txn1' })
    };
    
    const mockAuditService = {
      initialize: jest.fn().mockResolvedValue(),
      logSystemEvent: jest.fn().mockResolvedValue()
    };
    
    // Assign mocks to prototype
    ShopifySyncService.prototype.customerDAO = mockCustomerDAO;
    ShopifySyncService.prototype.transactionDAO = mockTransactionDAO;
    ShopifySyncService.prototype.auditService = mockAuditService;
  });
  
  test('syncs customers from Shopify', async () => {
    const syncService = new ShopifySyncService();
    const result = await syncService.syncCustomers();
    
    // Verify API call
    expect(mockAxios.history.get.length).toBe(1);
    expect(mockAxios.history.get[0].url).toBe('/api/shopify/customers');
    
    // Verify customer creation
    expect(syncService.customerDAO.createCustomer).toHaveBeenCalledTimes(2);
    expect(syncService.customerDAO.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        shopifyCustomerId: '101',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      })
    );
    
    // Verify audit logging
    expect(syncService.auditService.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SYNC',
        action: 'CUSTOMER_SYNC',
        status: 'SUCCESS'
      })
    );
  });
  
  test('syncs orders from Shopify', async () => {
    const syncService = new ShopifySyncService();
    const result = await syncService.syncOrders();
    
    // Verify API call
    expect(mockAxios.history.get.length).toBe(1);
    expect(mockAxios.history.get[0].url).toBe('/api/shopify/orders');
    
    // Verify transaction creation
    expect(syncService.transactionDAO.createTransaction).toHaveBeenCalledTimes(1);
    expect(syncService.transactionDAO.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        shopifyOrderId: '1001',
        type: 'buy',
        status: 'completed'
      })
    );
    
    // Verify audit logging
    expect(syncService.auditService.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SYNC',
        action: 'ORDER_SYNC',
        status: 'SUCCESS'
      })
    );
  });
  
  test('handles sync errors gracefully', async () => {
    // Override mock to simulate error
    mockAxios.reset();
    mockAxios.onGet('/api/shopify/customers').reply(500, { error: 'Shopify API error' });
    
    const syncService = new ShopifySyncService();
    const result = await syncService.syncCustomers();
    
    // Verify error handling
    expect(syncService.auditService.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SYNC',
        action: 'CUSTOMER_SYNC',
        status: 'ERROR',
        error: expect.any(String)
      })
    );
  });
}); 