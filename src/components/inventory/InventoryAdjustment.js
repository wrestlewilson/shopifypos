import React, { useState } from 'react';
import InventoryTrackingService from '../../services/inventory/inventoryTrackingService';
import './InventoryAdjustment.css';

const InventoryAdjustment = ({ transactionType, items, onInventoryUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState(null);

  // Update inventory for buy transaction
  const updateInventory = async () => {
    if (!items || items.length === 0) return;
    
    // Only update inventory for buy transactions
    if (transactionType !== 'buy') {
      if (onInventoryUpdated) {
        onInventoryUpdated({ success: true });
      }
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      
      const service = new InventoryTrackingService();
      await service.initialize();
      
      await service.updateInventoryLevels(items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        operation: 'add'
      })));
      
      setUpdated(true);
      
      // Call the callback with the result
      if (onInventoryUpdated) {
        onInventoryUpdated({
          success: true
        });
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError('Failed to update inventory');
      
      // Call the callback with the error
      if (onInventoryUpdated) {
        onInventoryUpdated({
          success: false,
          error: 'Failed to update inventory'
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (updating) return <div className="inventory-adjustment-loading">Updating inventory...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (transactionType !== 'buy') return null;

  return (
    <div className="inventory-adjustment">
      {updated ? (
        <div className="update-success">
          <p>Inventory has been updated with the purchased items.</p>
        </div>
      ) : (
        <button onClick={updateInventory} className="secondary">Update Inventory</button>
      )}
    </div>
  );
};

export default InventoryAdjustment; 