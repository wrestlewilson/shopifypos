import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import styled from 'styled-components';

const WidgetContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TransactionForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 12px;
  background: #5C6AC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #4F5DB3;
  }
`;

const TransactionWidget = () => {
  const { currentCustomer, saveTransaction } = useStore();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('buy');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCustomer) {
      alert('Please select a customer first');
      return;
    }

    const transaction = {
      customerId: currentCustomer.id,
      type,
      amount: parseFloat(amount),
      date: new Date(),
    };

    try {
      await saveTransaction(transaction);
      setAmount('');
      alert('Transaction saved successfully!');
    } catch (error) {
      alert('Failed to save transaction');
      console.error(error);
    }
  };

  return (
    <WidgetContainer>
      <h2>New Transaction</h2>
      <TransactionForm onSubmit={handleSubmit}>
        <div>
          <label>Transaction Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="trade">Trade</option>
          </select>
        </div>
        
        <div>
          <label>Amount:</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <Button type="submit">
          Process Transaction
        </Button>
      </TransactionForm>
    </WidgetContainer>
  );
};

export default TransactionWidget; 