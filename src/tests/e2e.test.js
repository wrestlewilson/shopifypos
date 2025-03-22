import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Add custom matchers
expect.extend({ toMatchImageSnapshot });

// End-to-End Test Suite
describe('End-to-End Tests', () => {
  let browser;
  let page;
  
  // Setup before tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  // Teardown after tests
  afterAll(async () => {
    await browser.close();
  });
  
  // Setup before each test
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({
      width: 1280,
      height: 800
    });
    
    // Mock localStorage
    await page.evaluateOnNewDocument(() => {
      const localStorageMock = (() => {
        let store = {};
        return {
          getItem: key => store[key] || null,
          setItem: (key, value) => { store[key] = value.toString(); },
          removeItem: key => { delete store[key]; },
          clear: () => { store = {}; }
        };
      })();
      
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });
    });
    
    // Mock authentication
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('auth_token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        roles: ['manager'],
        permissions: ['manage_transactions', 'manage_customers', 'view_reports']
      }));
    });
  });
  
  // Teardown after each test
  afterEach(async () => {
    await page.close();
  });
  
  // Helper function to wait for network idle
  const waitForNetworkIdle = async (page, timeout = 5000) => {
    await page.waitForNetworkIdle({ idleTime: 500, timeout });
  };
  
  test('Complete buy transaction flow', async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await waitForNetworkIdle(page);
    
    // Take screenshot of the home page
    const homeScreenshot = await page.screenshot();
    expect(homeScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'home-page'
    });
    
    // Navigate to transactions page
    await page.click('[data-testid="nav-transactions"]');
    await waitForNetworkIdle(page);
    
    // Click on "New Transaction" button
    await page.click('[data-testid="new-transaction-button"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of transaction type selection
    const transactionTypeScreenshot = await page.screenshot();
    expect(transactionTypeScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'transaction-type-selection'
    });
    
    // Select "Buy from Customer" transaction type
    await page.click('[data-testid="transaction-type-buy"]');
    await waitForNetworkIdle(page);
    
    // Search for a customer
    await page.type('[data-testid="customer-search-input"]', 'John');
    await page.click('[data-testid="customer-search-button"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of customer search results
    const customerSearchScreenshot = await page.screenshot();
    expect(customerSearchScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'customer-search-results'
    });
    
    // Select the first customer from results
    await page.click('[data-testid="customer-result-0"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of transaction form
    const transactionFormScreenshot = await page.screenshot();
    expect(transactionFormScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'transaction-form'
    });
    
    // Add an item to the transaction
    await page.type('[data-testid="item-name-input"]', 'Vintage Record');
    await page.type('[data-testid="item-price-input"]', '15.99');
    await page.type('[data-testid="item-quantity-input"]', '2');
    await page.click('[data-testid="add-item-button"]');
    await page.waitForSelector('[data-testid="item-row-0"]');
    
    // Take screenshot after adding item
    const itemAddedScreenshot = await page.screenshot();
    expect(itemAddedScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'transaction-with-item'
    });
    
    // Select payment method
    await page.select('[data-testid="payment-method-select"]', 'cash');
    
    // Add notes
    await page.type('[data-testid="transaction-notes"]', 'End-to-end test transaction');
    
    // Complete the transaction
    await page.click('[data-testid="complete-transaction-button"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of transaction confirmation
    const confirmationScreenshot = await page.screenshot();
    expect(confirmationScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'transaction-confirmation'
    });
    
    // Verify success message is displayed
    const successMessage = await page.$eval('[data-testid="transaction-success-message"]', el => el.textContent);
    expect(successMessage).toContain('Transaction completed successfully');
    
    // Verify transaction ID is displayed
    const transactionId = await page.$eval('[data-testid="transaction-id"]', el => el.textContent);
    expect(transactionId).toMatch(/Transaction ID: [a-zA-Z0-9]+/);
  });
  
  test('Customer profile and store credit management', async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await waitForNetworkIdle(page);
    
    // Navigate to customers page
    await page.click('[data-testid="nav-customers"]');
    await waitForNetworkIdle(page);
    
    // Search for a customer
    await page.type('[data-testid="customer-search-input"]', 'John');
    await page.click('[data-testid="customer-search-button"]');
    await waitForNetworkIdle(page);
    
    // Select the first customer from results
    await page.click('[data-testid="customer-result-0"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of customer profile
    const profileScreenshot = await page.screenshot();
    expect(profileScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'customer-profile'
    });
    
    // Click on "Manage Store Credit" tab
    await page.click('[data-testid="tab-store-credit"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of store credit management
    const storeCreditScreenshot = await page.screenshot();
    expect(storeCreditScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'store-credit-management'
    });
    
    // Click on "Add Credit" button
    await page.click('[data-testid="add-credit-button"]');
    await page.waitForSelector('[data-testid="credit-form"]');
    
    // Fill the credit form
    await page.type('[data-testid="credit-amount-input"]', '25');
    await page.type('[data-testid="credit-reason-input"]', 'End-to-end test credit');
    
    // Take screenshot of credit form
    const creditFormScreenshot = await page.screenshot();
    expect(creditFormScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'add-credit-form'
    });
    
    // Submit the form
    await page.click('[data-testid="submit-credit-button"]');
    await waitForNetworkIdle(page);
    
    // Verify success message
    const successMessage = await page.$eval('[data-testid="credit-success-message"]', el => el.textContent);
    expect(successMessage).toContain('Credit added successfully');
    
    // Verify updated balance is displayed
    const balanceText = await page.$eval('[data-testid="credit-balance"]', el => el.textContent);
    expect(balanceText).toMatch(/Current Balance: \$[0-9]+\.[0-9]{2}/);
  });
  
  test('Reporting dashboard functionality', async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await waitForNetworkIdle(page);
    
    // Navigate to reports page
    await page.click('[data-testid="nav-reports"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of reports dashboard
    const reportsScreenshot = await page.screenshot();
    expect(reportsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'reports-dashboard'
    });
    
    // Select date range
    await page.click('[data-testid="date-range-selector"]');
    await page.click('[data-testid="date-range-last-30-days"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot after date selection
    const dateRangeScreenshot = await page.screenshot();
    expect(dateRangeScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'reports-30-days'
    });
    
    // Switch to transaction type report
    await page.click('[data-testid="report-type-transactions"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of transaction report
    const transactionReportScreenshot = await page.screenshot();
    expect(transactionReportScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'transaction-report'
    });
    
    // Verify chart is rendered
    const chartExists = await page.$eval('[data-testid="transactions-chart"]', el => !!el);
    expect(chartExists).toBe(true);
    
    // Export report
    await page.click('[data-testid="export-report-button"]');
    await page.click('[data-testid="export-csv-option"]');
    
    // Wait for download to start
    await page.waitForSelector('[data-testid="download-started-message"]');
    
    // Verify download message
    const downloadMessage = await page.$eval('[data-testid="download-started-message"]', el => el.textContent);
    expect(downloadMessage).toContain('Download started');
  });
  
  test('Error handling and validation', async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await waitForNetworkIdle(page);
    
    // Navigate to transactions page
    await page.click('[data-testid="nav-transactions"]');
    await waitForNetworkIdle(page);
    
    // Click on "New Transaction" button
    await page.click('[data-testid="new-transaction-button"]');
    await waitForNetworkIdle(page);
    
    // Select "Buy from Customer" transaction type
    await page.click('[data-testid="transaction-type-buy"]');
    await waitForNetworkIdle(page);
    
    // Search for a non-existent customer
    await page.type('[data-testid="customer-search-input"]', 'NonExistentCustomer');
    await page.click('[data-testid="customer-search-button"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of no results message
    const noResultsScreenshot = await page.screenshot();
    expect(noResultsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'no-customer-results'
    });
    
    // Verify no results message
    const noResultsMessage = await page.$eval('[data-testid="no-results-message"]', el => el.textContent);
    expect(noResultsMessage).toContain('No customers found');
    
    // Click on "Create New Customer" button
    await page.click('[data-testid="create-customer-button"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of customer form
    const customerFormScreenshot = await page.screenshot();
    expect(customerFormScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'new-customer-form'
    });
    
    // Try to submit form without required fields
    await page.click('[data-testid="submit-customer-button"]');
    await page.waitForSelector('[data-testid="validation-error"]');
    
    // Take screenshot of validation errors
    const validationErrorsScreenshot = await page.screenshot();
    expect(validationErrorsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'customer-validation-errors'
    });
    
    // Verify validation error messages
    const validationErrors = await page.$$eval('[data-testid="validation-error"]', errors => 
      errors.map(error => error.textContent)
    );
    
    expect(validationErrors).toContain('First name is required');
    expect(validationErrors).toContain('Last name is required');
    expect(validationErrors).toContain('Email is required');
  });
  
  test('Responsive design on different screen sizes', async () => {
    // Test on mobile viewport
    await page.setViewport({
      width: 375,
      height: 667
    });
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await waitForNetworkIdle(page);
    
    // Take screenshot of home page on mobile
    const mobileHomeScreenshot = await page.screenshot();
    expect(mobileHomeScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'mobile-home-page'
    });
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('[data-testid="mobile-nav-menu"]', { visible: true });
    
    // Take screenshot of mobile menu
    const mobileMenuScreenshot = await page.screenshot();
    expect(mobileMenuScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'mobile-menu-open'
    });
    
    // Navigate to transactions page
    await page.click('[data-testid="mobile-nav-transactions"]');
    await waitForNetworkIdle(page);
    
    // Take screenshot of transactions page on mobile
    const mobileTransactionsScreenshot = await page.screenshot();
    expect(mobileTransactionsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'mobile-transactions-page'
    });
    
    // Test on tablet viewport
    await page.setViewport({
      width: 768,
      height: 1024
    });
    
    // Refresh the page
    await page.reload();
    await waitForNetworkIdle(page);
    
    // Take screenshot of transactions page on tablet
    const tabletTransactionsScreenshot = await page.screenshot();
    expect(tabletTransactionsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'tablet-transactions-page'
    });
    
    // Test on desktop viewport
    await page.setViewport({
      width: 1280,
      height: 800
    });
    
    // Refresh the page
    await page.reload();
    await waitForNetworkIdle(page);
    
    // Take screenshot of transactions page on desktop
    const desktopTransactionsScreenshot = await page.screenshot();
    expect(desktopTransactionsScreenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'desktop-transactions-page'
    });
  });
});

export default {}; 