import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { performance } from 'perf_hooks';
import { AuthProvider } from '../contexts/AuthContext';
import { TransactionWidget } from '../components/transactions/TransactionWidget';
import { CustomerSearch } from '../components/customer/CustomerSearch';
import { ReportingDashboard } from '../components/reports/ReportingDashboard';
import { CacheManager } from '../services/cache/CacheManager';

// Mock dependencies
jest.mock('../services/data/CustomerDAO');
jest.mock('../services/shopify/auth', () => ({
  createAuthenticatedClient: jest.fn().mockResolvedValue({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })
}));

// Performance Test Suite
describe('Performance Tests', () => {
  // Helper function to measure render time
  const measureRenderTime = async (Component, props = {}) => {
    const start = performance.now();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <Component {...props} />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for component to finish rendering
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    const end = performance.now();
    return end - start;
  };
  
  // Helper function to measure operation time
  const measureOperationTime = async (operation) => {
    const start = performance.now();
    await operation();
    const end = performance.now();
    return end - start;
  };
  
  test('CustomerSearch component renders within performance threshold', async () => {
    const renderTime = await measureRenderTime(CustomerSearch, { onSelectCustomer: () => {} });
    
    console.log(`CustomerSearch render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(200); // 200ms threshold
  });
  
  test('TransactionWidget component renders within performance threshold', async () => {
    const renderTime = await measureRenderTime(TransactionWidget);
    
    console.log(`TransactionWidget render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(300); // 300ms threshold
  });
  
  test('ReportingDashboard component renders within performance threshold', async () => {
    const renderTime = await measureRenderTime(ReportingDashboard);
    
    console.log(`ReportingDashboard render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(500); // 500ms threshold
  });
  
  test('CacheManager operations perform within expected thresholds', async () => {
    const cacheManager = new CacheManager();
    const itemCount = 1000;
    
    // Measure set operation time
    const setTime = await measureOperationTime(async () => {
      for (let i = 0; i < itemCount; i++) {
        cacheManager.set(`key${i}`, { data: `value${i}` });
      }
    });
    
    console.log(`CacheManager set ${itemCount} items time: ${setTime.toFixed(2)}ms`);
    expect(setTime).toBeLessThan(100); // 100ms threshold
    
    // Measure get operation time
    const getTime = await measureOperationTime(async () => {
      for (let i = 0; i < itemCount; i++) {
        cacheManager.get(`key${i}`);
      }
    });
    
    console.log(`CacheManager get ${itemCount} items time: ${getTime.toFixed(2)}ms`);
    expect(getTime).toBeLessThan(50); // 50ms threshold
    
    // Measure has operation time
    const hasTime = await measureOperationTime(async () => {
      for (let i = 0; i < itemCount; i++) {
        cacheManager.has(`key${i}`);
      }
    });
    
    console.log(`CacheManager has ${itemCount} items time: ${hasTime.toFixed(2)}ms`);
    expect(hasTime).toBeLessThan(50); // 50ms threshold
    
    // Measure delete operation time
    const deleteTime = await measureOperationTime(async () => {
      for (let i = 0; i < itemCount; i++) {
        cacheManager.delete(`key${i}`);
      }
    });
    
    console.log(`CacheManager delete ${itemCount} items time: ${deleteTime.toFixed(2)}ms`);
    expect(deleteTime).toBeLessThan(50); // 50ms threshold
  });
  
  test('CustomerSearch handles large result sets efficiently', async () => {
    // Generate large mock data
    const generateMockCustomers = (count) => {
      const customers = [];
      for (let i = 0; i < count; i++) {
        customers.push({
          _id: `cust${i}`,
          firstName: `First${i}`,
          lastName: `Last${i}`,
          email: `customer${i}@example.com`,
          storeCredit: { balance: Math.random() * 100 }
        });
      }
      return customers;
    };
    
    const mockCustomers = generateMockCustomers(500);
    
    // Mock the customer search API
    const mockSearchCustomers = jest.fn().mockResolvedValue({
      customers: mockCustomers,
      totalPages: 10,
      currentPage: 1,
      totalItems: 500
    });
    
    // Inject mock into component
    const CustomerSearchWithMock = (props) => {
      const originalCustomerDAO = require('../services/data/CustomerDAO').CustomerDAO;
      originalCustomerDAO.prototype.searchCustomers = mockSearchCustomers;
      return <CustomerSearch {...props} />;
    };
    
    // Measure render and interaction time
    render(
      <MemoryRouter>
        <AuthProvider>
          <CustomerSearchWithMock onSelectCustomer={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Search for customers
    const searchTime = await measureOperationTime(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search customers/i), { target: { value: 'test' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
      
      await waitFor(() => {
        expect(mockSearchCustomers).toHaveBeenCalled();
      });
    });
    
    console.log(`CustomerSearch with 500 results time: ${searchTime.toFixed(2)}ms`);
    expect(searchTime).toBeLessThan(1000); // 1000ms threshold
    
    // Measure rendering of results
    const resultsRenderTime = await measureOperationTime(async () => {
      await waitFor(() => {
        expect(screen.getByText('First0 Last0')).toBeInTheDocument();
      });
    });
    
    console.log(`CustomerSearch results render time: ${resultsRenderTime.toFixed(2)}ms`);
    expect(resultsRenderTime).toBeLessThan(500); // 500ms threshold
  });
  
  test('TransactionForm handles many line items efficiently', async () => {
    // Mock dependencies
    const mockCustomer = {
      _id: 'cust1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      storeCredit: { balance: 50 }
    };
    
    // Import the component
    const { TransactionForm } = require('../components/transactions/TransactionForm');
    
    // Render the component
    render(
      <MemoryRouter>
        <AuthProvider>
          <TransactionForm
            customer={mockCustomer}
            transactionType="buy"
            onSubmit={() => {}}
            onCancel={() => {}}
          />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Add many items and measure performance
    const itemCount = 20;
    const addItemsTime = await measureOperationTime(async () => {
      for (let i = 0; i < itemCount; i++) {
        fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: `Item ${i}` } });
        fireEvent.change(screen.getByLabelText(/price/i), { target: { value: `${(Math.random() * 50).toFixed(2)}` } });
        fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: `${Math.floor(Math.random() * 5) + 1}` } });
        fireEvent.click(screen.getByRole('button', { name: /add item/i }));
        
        // Wait for item to be added to the list
        await waitFor(() => {
          expect(screen.getByText(`Item ${i}`)).toBeInTheDocument();
        });
      }
    });
    
    console.log(`TransactionForm add ${itemCount} items time: ${addItemsTime.toFixed(2)}ms`);
    expect(addItemsTime).toBeLessThan(2000); // 2000ms threshold for adding 20 items
    
    // Measure calculation time
    const calculationTime = await measureOperationTime(async () => {
      // Trigger recalculation by changing tax exempt status
      const taxExemptCheckbox = screen.getByLabelText(/tax exempt/i);
      fireEvent.click(taxExemptCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText(/tax: \$0\.00/i)).toBeInTheDocument();
      });
      
      // Toggle back
      fireEvent.click(taxExemptCheckbox);
      
      await waitFor(() => {
        expect(screen.queryByText(/tax: \$0\.00/i)).not.toBeInTheDocument();
      });
    });
    
    console.log(`TransactionForm calculation time: ${calculationTime.toFixed(2)}ms`);
    expect(calculationTime).toBeLessThan(200); // 200ms threshold
  });
  
  test('EncryptionService performs within acceptable thresholds', async () => {
    const { EncryptionService } = require('../services/security/EncryptionService');
    const encryptionService = new EncryptionService('test-encryption-key');
    
    // Generate test data of various sizes
    const generateTestData = (size) => {
      let data = '';
      for (let i = 0; i < size; i++) {
        data += 'a';
      }
      return data;
    };
    
    const dataSizes = [10, 100, 1000, 10000, 100000];
    
    for (const size of dataSizes) {
      const testData = generateTestData(size);
      
      // Measure encryption time
      const encryptTime = await measureOperationTime(async () => {
        encryptionService.encrypt(testData);
      });
      
      console.log(`Encrypt ${size} chars time: ${encryptTime.toFixed(2)}ms`);
      
      // Encrypt for decryption test
      const encrypted = encryptionService.encrypt(testData);
      
      // Measure decryption time
      const decryptTime = await measureOperationTime(async () => {
        encryptionService.decrypt(encrypted);
      });
      
      console.log(`Decrypt ${size} chars time: ${decryptTime.toFixed(2)}ms`);
      
      // Set thresholds based on data size
      const threshold = size <= 1000 ? 50 : (size <= 10000 ? 100 : 500);
      
      expect(encryptTime).toBeLessThan(threshold);
      expect(decryptTime).toBeLessThan(threshold);
    }
  });
  
  test('Memory usage remains within acceptable limits', async () => {
    // This is a simplified memory usage test
    // In a real environment, you would use more sophisticated memory profiling tools
    
    // Function to get approximate memory usage
    const getMemoryUsage = () => {
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        return window.performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      }
      
      // Node.js environment
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const { heapUsed } = process.memoryUsage();
        return heapUsed / (1024 * 1024); // MB
      }
      
      return 0; // Unable to determine
    };
    
    // Measure memory before
    const memoryBefore = getMemoryUsage();
    
    // Perform memory-intensive operations
    const { CacheManager } = require('../services/cache/CacheManager');
    const cacheManager = new CacheManager();
    
    // Add many items to cache
    for (let i = 0; i < 10000; i++) {
      cacheManager.set(`key${i}`, { data: `value${i}`, moreData: Array(100).fill(`data${i}`) });
    }
    
    // Measure memory after
    const memoryAfter = getMemoryUsage();
    const memoryIncrease = memoryAfter - memoryBefore;
    
    console.log(`Memory usage increase: ${memoryIncrease.toFixed(2)}MB`);
    
    // Skip actual assertion if we couldn't measure memory
    if (memoryIncrease > 0) {
      expect(memoryIncrease).toBeLessThan(50); // 50MB threshold
    }
  });
}); 