import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const CardHeader = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: #5C6AC4;
  font-size: 24px;
`;

const Section = styled.div`
  margin-bottom: 20px;

  h3 {
    color: #333;
    margin-bottom: 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &.primary {
    background: #5C6AC4;
    color: white;

    &:hover {
      background: #4f5db3;
    }
  }

  &.secondary {
    background: #f4f6f8;
    color: #5C6AC4;
    border: 1px solid #5C6AC4;

    &:hover {
      background: #eef0f4;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
  }
`;

const TransactionForm = ({ type, onComplete, onCancel }) => {
  const { currentCustomer, settings } = useStore();
  
  // For demo purposes, create mock items
  const mockItems = [
    {
      id: 'item-1',
      name: 'Vintage Record Player',
      sku: 'VRP-001',
      price: 89.99,
      quantity: 1,
      isNew: false,
      taxable: true
    },
    {
      id: 'item-2',
      name: 'Classic Rock Vinyl Collection',
      sku: 'VIN-100',
      price: 45.50,
      quantity: 1,
      isNew: false,
      taxable: true
    }
  ];
  
  // For demo purposes, create mock payments
  const mockPayments = [
    {
      method: 'cash',
      amount: 50.00
    },
    {
      method: 'store_credit',
      amount: 85.49
    }
  ];
  
  const [items, setItems] = useState(type === 'sell' ? mockItems : []);
  const [payments, setPayments] = useState(type === 'sell' ? mockPayments : []);
  const [notes, setNotes] = useState('');
  const [total, setTotal] = useState(type === 'sell' ? 135.49 : 0);
  const [tax, setTax] = useState(type === 'sell' ? 10.84 : 0);
  const [isTaxable, setIsTaxable] = useState(type !== 'trade');
  
  // Handle adding an item to the transaction
  const handleAddItem = () => {
    // In a real implementation, this would open a modal or form to add an item
    alert('This would open an item selection interface in the full implementation');
  };
  
  // Handle removing an item from the transaction
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  // Handle adding a payment
  const handleAddPayment = () => {
    // In a real implementation, this would open a modal or form to add a payment
    alert('This would open a payment entry interface in the full implementation');
  };
  
  // Handle removing a payment
  const handleRemovePayment = (index) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!currentCustomer) {
      alert('Please select a customer first');
      return;
    }
    
    // Create transaction object
    const transaction = {
      id: `transaction-${Date.now()}`,
      type,
      customerId: currentCustomer.id,
      items,
      payments,
      total,
      taxable: isTaxable,
      tax,
      date: new Date(),
      locationId: 'current-location',
      employeeId: 'current-employee',
      notes
    };
    
    // Complete the transaction
    onComplete(transaction);
  };
  
  // Render different form based on transaction type
  const renderTransactionTypeSpecificFields = () => {
    switch (type) {
      case 'buy':
        return (
          <Section>
            <h3>Buy Transaction</h3>
            <p>Enter items the customer is selling to the store</p>
          </Section>
        );
      case 'sell':
        return (
          <Section>
            <h3>Sell Transaction</h3>
            <p>Enter items the store is selling to the customer</p>
          </Section>
        );
      case 'trade':
        return (
          <Section>
            <h3>Trade Transaction</h3>
            <p>Apply same-day trade credit (tax exempt)</p>
            <FormGroup>
              <label>
                <input 
                  type="checkbox" 
                  checked={!isTaxable} 
                  onChange={() => setIsTaxable(!isTaxable)} 
                />
                Tax Exempt Transaction (Same-day Trade)
              </label>
            </FormGroup>
          </Section>
        );
      case 'consignment':
        return (
          <Section>
            <h3>Consignment Transaction</h3>
            <p>Track revenue-sharing agreement</p>
          </Section>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{type.charAt(0).toUpperCase() + type.slice(1)} Transaction</CardTitle>
      </CardHeader>
      
      {/* Customer information */}
      <Section>
        <h3>Customer Information</h3>
        {currentCustomer ? (
          <div>
            <p><strong>Name:</strong> {currentCustomer.name}</p>
            <p><strong>Email:</strong> {currentCustomer.email}</p>
            <p><strong>Phone:</strong> {currentCustomer.phone}</p>
            <p><strong>Store Credit:</strong> ${currentCustomer.storeCredit.toFixed(2)}</p>
          </div>
        ) : (
          <p>No customer selected</p>
        )}
      </Section>
      
      {/* Transaction type specific fields */}
      {renderTransactionTypeSpecificFields()}
      
      {/* Items section */}
      <Section>
        <h3>Items</h3>
        {items.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
                <th>New/Used</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.isNew ? 'New' : 'Used'}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button onClick={() => handleRemoveItem(index)} className="secondary">Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No items added</p>
        )}
        
        <Button onClick={handleAddItem} className="secondary">Add Item</Button>
      </Section>
      
      {/* Payments section */}
      <Section>
        <h3>Payments</h3>
        {payments.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.method.replace('_', ' ').toUpperCase()}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.reference || 'N/A'}</td>
                  <td>
                    <Button onClick={() => handleRemovePayment(index)} className="secondary">Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No payments added</p>
        )}
        
        <Button onClick={handleAddPayment} className="secondary">Add Payment</Button>
      </Section>
      
      {/* Totals section */}
      <Section>
        <h3>Transaction Summary</h3>
        <p><strong>Subtotal:</strong> ${total.toFixed(2)}</p>
        <p><strong>Tax ({(settings?.taxRate * 100 || 8).toFixed(2)}%):</strong> ${tax.toFixed(2)}</p>
        <p><strong>Total:</strong> ${(total + tax).toFixed(2)}</p>
      </Section>
      
      {/* Notes section */}
      <Section>
        <h3>Notes</h3>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter any notes about this transaction"
          rows={3}
        />
      </Section>
      
      {/* Action buttons */}
      <ButtonGroup>
        <Button onClick={onCancel} className="secondary">Cancel</Button>
        <Button onClick={handleSubmit} className="primary">Complete Transaction</Button>
      </ButtonGroup>
    </Card>
  );
};

export default TransactionForm; 