# Shopify POS Buy/Sell/Trade App

A modern React application for managing buy, sell, and trade transactions in a retail environment. Built with React, styled-components, and Shopify's App Bridge.

## Features

- Transaction management (Buy/Sell/Trade)
- Real-time reporting dashboard
- Store credit management
- Customer management
- Shopify integration

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Shopify store (for full functionality)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopify-pos-bst-app.git
cd shopify-pos-bst-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
  ├── components/
  │   ├── transactions/
  │   │   └── TransactionWidget.js
  │   └── reports/
  │       └── ReportingDashboard.js
  ├── contexts/
  │   └── StoreContext.js
  ├── App.js
  └── index.js
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
