import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerSearch } from '../components/customer/CustomerSearch';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { StoreCreditManagement } from '../components/credit/StoreCreditManagement';
import { AuthProvider } from '../5_security_user_authentication';
import { CustomerDAO } from '../6_data_persistence_data_access';
import { EncryptionService } from '../5_security_data_encryption';

// Mock the dependencies
jest.mock('../6_data_persistence_data_access');
jest.mock('../5_security_data_encryption');
jest.mock('../1_shopify_integration_auth_flow', () => ({
  createAuthenticatedClient: jest.fn().mockResolvedValue({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })
}));

// Customer Search Component Tests
describe('CustomerSearch Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders search input and button', () => {
    render(<CustomerSearch onSelectCustomer={() => {}} />);
    
    expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
  
  test('displays loading state while searching', async () => {
    // Mock the API call to delay response
    const mockApiCall = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ customers: [], totalPages: 0, currentPage: 1, totalItems: 0 });
        }, 100);
      });
    });
    
    CustomerDAO.prototype.searchCustomers = mockApiCall;
    
    render(<CustomerSearch onSelectCustomer={() => {}} />);
    
    // Enter search term and click search
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Check loading state
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    });
    
    // Verify API was called with correct parameters
    expect(mockApiCall).toHaveBeenCalledWith('John', expect.any(Object));
  });
  
  test('displays search results correctly', async () => {
    // Mock search results
    const mockCustomers = [
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', storeCredit: { balance: 50 } },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', storeCredit: { balance: 25 } }
    ];
    
    CustomerDAO.prototype.searchCustomers = jest.fn().mockResolvedValue({
      customers: mockCustomers,
      totalPages: 1,
      currentPage: 1,
      totalItems: 2
    });
    
    render(<CustomerSearch onSelectCustomer={() => {}} />);
    
    // Enter search term and click search
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'Jo' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Wait for results to display
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Check if store credit is displayed
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });
  
  test('calls onSelectCustomer when a customer is clicked', async () => {
    // Mock search results
    const mockCustomers = [
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', storeCredit: { balance: 50 } }
    ];
    
    CustomerDAO.prototype.searchCustomers = jest.fn().mockResolvedValue({
      customers: mockCustomers,
      totalPages: 1,
      currentPage: 1,
      totalItems: 1
    });
    
    const handleSelectCustomer = jest.fn();
    
    render(<CustomerSearch onSelectCustomer={handleSelectCustomer} />);
    
    // Enter search term and click search
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Wait for results to display
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Click on customer
    fireEvent.click(screen.getByText('John Doe'));
    
    // Verify onSelectCustomer was called with the correct customer
    expect(handleSelectCustomer).toHaveBeenCalledWith(mockCustomers[0]);
  });
  
  test('displays no results message when search returns empty', async () => {
    CustomerDAO.prototype.searchCustomers = jest.fn().mockResolvedValue({
      customers: [],
      totalPages: 0,
      currentPage: 1,
      totalItems: 0
    });
    
    render(<CustomerSearch onSelectCustomer={() => {}} />);
    
    // Enter search term and click search
    fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'NonExistent' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Wait for no results message
    await waitFor(() => {
      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    });
  });
});

// Transaction Form Component Tests
describe('TransactionForm Component', () => {
  const mockCustomer = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    storeCredit: { balance: 50 }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders transaction form with customer information', () => {
    render(
      <TransactionForm 
        customer={mockCustomer}
        transactionType="buy"
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );
    
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/store credit balance: \$50\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/buy transaction/i)).toBeInTheDocument();
  });
  
  test('allows adding items to transaction', () => {
    render(
      <TransactionForm 
        customer={mockCustomer}
        transactionType="buy"
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Add an item
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10.99' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Check if item was added to the list
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$21.98')).toBeInTheDocument(); // Total for the item
  });
  
  test('calculates transaction totals correctly', () => {
    render(
      <TransactionForm 
        customer={mockCustomer}
        transactionType="buy"
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Add multiple items
    // Item 1
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Item 1' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10.00' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Item 2
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Item 2' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '15.50' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Check subtotal (10.00 * 2 + 15.50 * 1 = 35.50)
    expect(screen.getByText(/subtotal: \$35\.50/i)).toBeInTheDocument();
    
    // Check tax (assuming default tax rate of 7%)
    expect(screen.getByText(/tax: \$2\.49/i)).toBeInTheDocument();
    
    // Check total (35.50 + 2.49 = 37.99)
    expect(screen.getByText(/total: \$37\.99/i)).toBeInTheDocument();
  });
  
  test('handles form submission correctly', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <TransactionForm 
        customer={mockCustomer}
        transactionType="buy"
        onSubmit={handleSubmit}
        onCancel={() => {}}
      />
    );
    
    // Add an item
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '10.99' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    
    // Select payment method
    fireEvent.change(screen.getByLabelText(/payment method/i), { target: { value: 'cash' } });
    
    // Add notes
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Test transaction' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /complete transaction/i }));
    
    // Verify onSubmit was called with the correct data
    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
      customer: mockCustomer._id,
      type: 'buy',
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Item',
          price: 10.99,
          quantity: 2
        })
      ]),
      payments: expect.arrayContaining([
        expect.objectContaining({
          method: 'cash'
        })
      ]),
      notes: 'Test transaction'
    }));
  });
  
  test('validates required fields before submission', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <TransactionForm 
        customer={mockCustomer}
        transactionType="buy"
        onSubmit={handleSubmit}
        onCancel={() => {}}
      />
    );
    
    // Try to submit without adding items
    fireEvent.click(screen.getByRole('button', { name: /complete transaction/i }));
    
    // Check for validation error
    expect(screen.getByText(/at least one item is required/i)).toBeInTheDocument();
    
    // Verify onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});

// Store Credit Management Tests
describe('StoreCreditManagement Component', () => {
  const mockCustomer = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    storeCredit: { balance: 50, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders customer store credit information', () => {
    render(
      <AuthProvider>
        <StoreCreditManagement customer={mockCustomer} />
      </AuthProvider>
    );
    
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/current balance: \$50\.00/i)).toBeInTheDocument();
  });
  
  test('allows adding store credit', async () => {
    // Mock the API call
    const mockAddCredit = jest.fn().mockResolvedValue({
      success: true,
      newBalance: 75
    });
    
    // Mock the customer DAO
    CustomerDAO.prototype.updateCustomerStoreCredit = mockAddCredit;
    
    render(
      <AuthProvider>
        <StoreCreditManagement customer={mockCustomer} />
      </AuthProvider>
    );
    
    // Click on "Add Credit" button
    fireEvent.click(screen.getByRole('button', { name: /add credit/i }));
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Test credit' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockAddCredit).toHaveBeenCalledWith(
        mockCustomer._id,
        expect.objectContaining({
          balance: 75 // 50 + 25
        })
      );
    });
    
    // Check for success message
    expect(screen.getByText(/credit added successfully/i)).toBeInTheDocument();
  });
  
  test('validates credit amount before submission', async () => {
    render(
      <AuthProvider>
        <StoreCreditManagement customer={mockCustomer} />
      </AuthProvider>
    );
    
    // Click on "Add Credit" button
    fireEvent.click(screen.getByRole('button', { name: /add credit/i }));
    
    // Try to submit with invalid amount
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '-10' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check for validation error
    expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
  });
  
  test('allows using store credit', async () => {
    // Mock the API call
    const mockUseCredit = jest.fn().mockResolvedValue({
      success: true,
      newBalance: 30
    });
    
    // Mock the customer DAO
    CustomerDAO.prototype.updateCustomerStoreCredit = mockUseCredit;
    
    render(
      <AuthProvider>
        <StoreCreditManagement customer={mockCustomer} />
      </AuthProvider>
    );
    
    // Click on "Use Credit" button
    fireEvent.click(screen.getByRole('button', { name: /use credit/i }));
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Test purchase' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockUseCredit).toHaveBeenCalledWith(
        mockCustomer._id,
        expect.objectContaining({
          balance: 30 // 50 - 20
        })
      );
    });
    
    // Check for success message
    expect(screen.getByText(/credit used successfully/i)).toBeInTheDocument();
  });
  
  test('prevents using more credit than available', async () => {
    render(
      <AuthProvider>
        <StoreCreditManagement customer={mockCustomer} />
      </AuthProvider>
    );
    
    // Click on "Use Credit" button
    fireEvent.click(screen.getByRole('button', { name: /use credit/i }));
    
    // Try to use more credit than available
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check for validation error
    expect(screen.getByText(/amount cannot exceed available balance/i)).toBeInTheDocument();
  });
});

// Encryption Service Tests
describe('EncryptionService', () => {
  let encryptionService;
  
  beforeEach(() => {
    encryptionService = new EncryptionService('test-encryption-key');
  });
  
  test('encrypts and decrypts data correctly', () => {
    const testData = { name: 'John Doe', ssn: '123-45-6789' };
    
    // Encrypt the data
    const encrypted = encryptionService.encrypt(testData);
    
    // Verify encrypted data is not the same as original
    expect(encrypted).not.toEqual(testData);
    expect(typeof encrypted).toBe('string');
    
    // Decrypt the data
    const decrypted = encryptionService.decrypt(encrypted);
    
    // Verify decrypted data matches original
    expect(decrypted).toEqual(testData);
  });
  
  test('hashes data correctly', () => {
    const testData = 'password123';
    
    // Hash the data
    const hashed = encryptionService.hash(testData);
    
    // Verify hashed data is not the same as original
    expect(hashed).not.toEqual(testData);
    expect(typeof hashed).toBe('string');
    
    // Verify same input produces same hash
    const hashedAgain = encryptionService.hash(testData);
    expect(hashedAgain).toBe(hashed);
  });
  
  test('verifies hash correctly', () => {
    const testData = 'password123';
    const hashed = encryptionService.hash(testData);
    
    // Verify correct password
    expect(encryptionService.verifyHash(testData, hashed)).toBe(true);
    
    // Verify incorrect password
    expect(encryptionService.verifyHash('wrongpassword', hashed)).toBe(false);
  });
});

export default {}; 