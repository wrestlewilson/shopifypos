import React, { useState, useEffect } from 'react';
import InventoryTrackingService from '../../services/inventory/inventoryTrackingService';
import './InventoryCheck.css';

const InventoryCheck = ({ items, onStockCheck }) => {
  const [checking, setChecking] = useState(false);
  const [stockStatus, setStockStatus] = useState({});
  const [error, setError] = useState(null);

  // Check stock for all items
  const checkAllStock = async () => {
    if (!items || items.length === 0) return;
    
    try {
      setChecking(true);
      setError(null);
      
      const service = new InventoryTrackingService();
      await service.initialize();
      
      const stockResults = {};
      let allInStock = true;
      
      // Check each item individually
      for (const item of items) {
        const result = await service.checkItemStock(item.id, item.quantity);
        stockResults[item.id] = result;
        
        if (!result.inStock) {
          allInStock = false;
        }
      }
      
      setStockStatus(stockResults);
      
      // Call the callback with the results
      if (onStockCheck) {
        onStockCheck({
          allInStock,
          stockResults
        });
      }
    } catch (err) {
      console.error('Error checking stock:', err);
      setError('Failed to check inventory status');
    } finally {
      setChecking(false);
    }
  };

  // Check stock when items change
  useEffect(() => {
    if (items && items.length > 0) {
      checkAllStock();
    }
  }, [items]);

  if (checking) return <div className="inventory-check-loading">Checking inventory status...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (Object.keys(stockStatus).length === 0) return null;

  return (
    <div className="inventory-check">
      <h3>Inventory Status</h3>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Requested</th>
            <th>Available</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const status = stockStatus[item.id] || {};
            return (
              <tr key={item.id} className={status.inStock ? 'in-stock' : 'out-of-stock'}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{status.availableQuantity || 0}</td>
                <td>
                  {status.inStock ? (
                    <span className="stock-status in-stock">In Stock</span>
                  ) : (
                    <span className="stock-status out-of-stock">
                      {status.availableQuantity > 0 ? 'Insufficient Stock' : 'Out of Stock'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {!Object.values(stockStatus).every(status => status.inStock) && (
        <div className="stock-warning">
          <p>Some items are out of stock or have insufficient quantity.</p>
          <button onClick={checkAllStock} className="secondary">Refresh Stock Status</button>
        </div>
      )}
    </div>
  );
};

export default InventoryCheck; 