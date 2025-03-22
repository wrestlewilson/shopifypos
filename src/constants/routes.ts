export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Main app routes
  DASHBOARD: '/',
  POS: '/pos',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  SETTINGS: '/settings',

  // Inventory routes
  PRODUCTS: '/inventory/products',
  CATEGORIES: '/inventory/categories',
  SUPPLIERS: '/inventory/suppliers',
  STOCK_ADJUSTMENTS: '/inventory/stock-adjustments',

  // Report routes
  SALES_REPORT: '/reports/sales',
  INVENTORY_REPORT: '/reports/inventory',
  CUSTOMER_REPORT: '/reports/customers',
  EMPLOYEE_REPORT: '/reports/employees',

  // Settings routes
  PROFILE: '/settings/profile',
  COMPANY: '/settings/company',
  USERS: '/settings/users',
  ROLES: '/settings/roles',
  TAXES: '/settings/taxes',
  PAYMENT_METHODS: '/settings/payment-methods',
} as const;

// Type for route values
export type Route = typeof ROUTES[keyof typeof ROUTES];

// Helper function to check if a path is a valid route
export const isValidRoute = (path: string): path is Route => {
  return Object.values(ROUTES).includes(path as Route);
};

// Helper function to get route name from path
export const getRouteName = (path: Route): string => {
  const routeMap: Record<Route, string> = {
    [ROUTES.LOGIN]: 'Login',
    [ROUTES.REGISTER]: 'Register',
    [ROUTES.FORGOT_PASSWORD]: 'Forgot Password',
    [ROUTES.RESET_PASSWORD]: 'Reset Password',
    [ROUTES.DASHBOARD]: 'Dashboard',
    [ROUTES.POS]: 'Point of Sale',
    [ROUTES.INVENTORY]: 'Inventory',
    [ROUTES.REPORTS]: 'Reports',
    [ROUTES.SETTINGS]: 'Settings',
    [ROUTES.PRODUCTS]: 'Products',
    [ROUTES.CATEGORIES]: 'Categories',
    [ROUTES.SUPPLIERS]: 'Suppliers',
    [ROUTES.STOCK_ADJUSTMENTS]: 'Stock Adjustments',
    [ROUTES.SALES_REPORT]: 'Sales Report',
    [ROUTES.INVENTORY_REPORT]: 'Inventory Report',
    [ROUTES.CUSTOMER_REPORT]: 'Customer Report',
    [ROUTES.EMPLOYEE_REPORT]: 'Employee Report',
    [ROUTES.PROFILE]: 'Profile',
    [ROUTES.COMPANY]: 'Company Settings',
    [ROUTES.USERS]: 'Users',
    [ROUTES.ROLES]: 'Roles',
    [ROUTES.TAXES]: 'Taxes',
    [ROUTES.PAYMENT_METHODS]: 'Payment Methods',
  };
  return routeMap[path];
}; 