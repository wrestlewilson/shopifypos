import React, { useState, useEffect } from 'react';
import InventoryTrackingService from '../../services/inventory/inventoryTrackingService';
import './InventoryChanges.css';

const InventoryChanges = ({ transactionType, items, onInventoryReserved }) => {
  const [reserving, setReserving] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [error, setError] = useState(null);

  // Reserve inventory for transaction
  const reserveInventory = async () => {
    if (!items || items.length === 0) return;
    
    // Only reserve inventory for sell transactions
    if (transactionType !== 'sell') {
      if (onInventoryReserved) {
        onInventoryReserved({ success: true, reservationId: null });
      }
      return;
    }
    
    try {
      setReserving(true);
      setError(null);
      
      const service = new InventoryTrackingService();
      await service.initialize();
      
      const result = await service.reserveInventory(items);
      setReservationId(result.reservationId);
      
      // Call the callback with the result
      if (onInventoryReserved) {
        onInventoryReserved({
          success: true,
          reservationId: result.reservationId
        });
      }
    } catch (err) {
      console.error('Error reserving inventory:', err);
      setError('Failed to reserve inventory');
      
      // Call the callback with the error
      if (onInventoryReserved) {
        onInventoryReserved({
          success: false,
          error: 'Failed to reserve inventory'
        });
      }
    } finally {
      setReserving(false);
    }
  };

  // Reserve inventory when items change
  useEffect(() => {
    if (transactionType === 'sell' && items && items.length > 0) {
      reserveInventory();
    }
  }, [transactionType, items]);

  if (reserving) return <div className="inventory-changes-loading">Reserving inventory...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (transactionType !== 'sell') return null;

  return (
    <div className="inventory-changes">
      {reservationId ? (
        <div className="reservation-success">
          <p>Inventory has been reserved for this transaction.</p>
          <p>Reservation ID: {reservationId}</p>
        </div>
      ) : (
        <button onClick={reserveInventory} className="secondary">Reserve Inventory</button>
      )}
    </div>
  );
};

export default InventoryChanges; 