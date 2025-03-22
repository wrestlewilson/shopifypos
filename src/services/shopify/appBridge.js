import { Provider, TitleBar } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { useAppBridge } from '@shopify/app-bridge-react';

// Initialize Shopify App Bridge
const appBridgeConfig = {
  apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
  host: new URL(window.location).searchParams.get('host'),
  forceRedirect: true
};

// App component with App Bridge Provider
function ShopifyApp({ children }) {
  return (
    <Provider config={appBridgeConfig}>
      <TitleBar title="BST Transaction Widget" />
      {children}
    </Provider>
  );
}

// Custom hook for authenticated fetch
function useAuthenticatedFetch() {
  const app = useAppBridge();
  
  return async (uri, options) => {
    const response = await fetch(uri, {
      ...options,
      headers: {
        ...options?.headers,
        'X-Shopify-Access-Token': await getSessionToken(app)
      },
    });
    
    if (response.headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
      const authUrlHeader = response.headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url');
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }
    
    return response;
  };
}

// Navigation using App Bridge
const redirectToShopifyAdmin = (app) => {
  const redirect = Redirect.create(app);
  redirect.dispatch(Redirect.Action.ADMIN_PATH, '/customers');
};

// Helper function to get session token
async function getSessionToken(app) {
  try {
    const sessionToken = await app.getSessionToken();
    return sessionToken;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

export { ShopifyApp, useAuthenticatedFetch, redirectToShopifyAdmin }; 