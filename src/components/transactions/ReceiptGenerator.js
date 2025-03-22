import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import './ReceiptGenerator.css';

const ReceiptGenerator = ({ transactionId }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/transactions/${transactionId}`);
        setTransaction(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load transaction data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  // Generate PDF receipt
  const generatePdfReceipt = async () => {
    if (!transaction) return;
    
    try {
      setGeneratingPdf(true);
      
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add store logo and header
      // In a real implementation, you would load and add the store logo
      doc.setFontSize(20);
      doc.text('Your Store Name', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('123 Main Street, City, State ZIP', pageWidth / 2, 30, { align: 'center' });
      doc.text('Phone: (555) 123-4567', pageWidth / 2, 35, { align: 'center' });
      
      // Add receipt title and transaction info
      doc.setFontSize(16);
      doc.text(`${transaction.type.toUpperCase()} RECEIPT`, pageWidth / 2, 45, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Transaction #: ${transaction.id}`, 14, 55);
      doc.text(`Date: ${new Date(transaction.date).toLocaleString()}`, 14, 60);
      doc.text(`Employee: ${transaction.employeeName}`, 14, 65);
      doc.text(`Location: ${transaction.locationName}`, 14, 70);
      
      // Add customer information
      if (transaction.customer) {
        doc.text('Customer Information:', 14, 80);
        doc.text(`Name: ${transaction.customer.firstName} ${transaction.customer.lastName}`, 14, 85);
        doc.text(`Email: ${transaction.customer.email}`, 14, 90);
        if (transaction.customer.phone) {
          doc.text(`Phone: ${transaction.customer.phone}`, 14, 95);
        }
      }
      
      // Add items table
      const tableColumn = ["Item", "SKU", "Price", "Qty", "Subtotal"];
      const tableRows = [];
      
      transaction.items.forEach(item => {
        const itemData = [
          item.name,
          item.sku,
          `$${item.price.toFixed(2)}`,
          item.quantity,
          `$${(item.price * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
      });
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: transaction.customer ? 105 : 80,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Get the final y position after the table
      const finalY = doc.lastAutoTable.finalY + 10;
      
      // Add payment information
      doc.text('Payment Information:', 14, finalY);
      let paymentY = finalY + 5;
      
      transaction.payments.forEach(payment => {
        doc.text(`${payment.method.replace('_', ' ').toUpperCase()}: $${payment.amount.toFixed(2)}`, 14, paymentY);
        paymentY += 5;
      });
      
      // Add totals
      const totalsX = pageWidth - 60;
      doc.text('Subtotal:', totalsX, finalY);
      doc.text(`$${transaction.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
      
      doc.text('Tax:', totalsX, finalY + 5);
      doc.text(`$${transaction.tax.toFixed(2)}`, pageWidth - 14, finalY + 5, { align: 'right' });
      
      if (transaction.storeCredit > 0) {
        doc.text('Store Credit:', totalsX, finalY + 10);
        doc.text(`-$${transaction.storeCredit.toFixed(2)}`, pageWidth - 14, finalY + 10, { align: 'right' });
      }
      
      doc.text('Total:', totalsX, finalY + 15);
      doc.text(`$${transaction.total.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });
      
      // Add store credit balance if applicable
      if (transaction.customer && transaction.customer.storeCredit !== undefined) {
        doc.text('Current Store Credit Balance:', totalsX, finalY + 25);
        doc.text(`$${transaction.customer.storeCredit.toFixed(2)}`, pageWidth - 14, finalY + 25, { align: 'right' });
      }
      
      // Add QR code for digital receipt
      const qrCodeUrl = `https://yourstore.com/receipts/${transaction.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
      doc.addImage(qrCodeDataUrl, 'PNG', 14, paymentY + 10, 30, 30);
      
      // Add footer
      const footerY = Math.max(paymentY + 45, finalY + 40);
      doc.setFontSize(8);
      doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Return policy: Items can be returned within 30 days with receipt.', pageWidth / 2, footerY + 5, { align: 'center' });
      doc.text(`Visit us online at www.yourstore.com`, pageWidth / 2, footerY + 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${transaction.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF receipt:', err);
      setError('Failed to generate PDF receipt');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Send receipt via email
  const sendEmailReceipt = async () => {
    if (!transaction || !transaction.customer || !transaction.customer.email) {
      setError('Customer email is required to send receipt');
      return;
    }
    
    try {
      setGeneratingEmail(true);
      const client = await createAuthenticatedClient();
      
      await client.post('/api/transactions/send-receipt', {
        transactionId: transaction.id,
        email: transaction.customer.email
      });
      
      // Show success message
      alert(`Receipt sent to ${transaction.customer.email}`);
    } catch (err) {
      console.error('Error sending email receipt:', err);
      setError('Failed to send email receipt');
    } finally {
      setGeneratingEmail(false);
    }
  };

  if (loading) return <div>Loading transaction data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!transaction) return <div>No transaction found</div>;

  return (
    <div className="receipt-generator">
      <h2>Receipt for Transaction #{transaction.id}</h2>
      
      <div className="receipt-preview">
        <div className="receipt-header">
          <h3>Your Store Name</h3>
          <p>123 Main Street, City, State ZIP</p>
          <p>Phone: (555) 123-4567</p>
          <h4>{transaction.type.toUpperCase()} RECEIPT</h4>
        </div>
        
        <div className="receipt-info">
          <p><strong>Transaction #:</strong> {transaction.id}</p>
          <p><strong>Date:</strong> {new Date(transaction.date).toLocaleString()}</p>
          <p><strong>Employee:</strong> {transaction.employeeName}</p>
          <p><strong>Location:</strong> {transaction.locationName}</p>
        </div>
        
        {transaction.customer && (
          <div className="customer-info">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> {transaction.customer.firstName} {transaction.customer.lastName}</p>
            <p><strong>Email:</strong> {transaction.customer.email}</p>
            {transaction.customer.phone && (
              <p><strong>Phone:</strong> {transaction.customer.phone}</p>
            )}
          </div>
        )}
        
        <div className="items-table">
          <h4>Items</h4>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="payment-info">
          <h4>Payment Information</h4>
          {transaction.payments.map((payment, index) => (
            <p key={index}>
              <strong>{payment.method.replace('_', ' ').toUpperCase()}:</strong> ${payment.amount.toFixed(2)}
            </p>
          ))}
        </div>
        
        <div className="receipt-totals">
          <p><strong>Subtotal:</strong> ${transaction.subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> ${transaction.tax.toFixed(2)}</p>
          {transaction.storeCredit > 0 && (
            <p><strong>Store Credit:</strong> -${transaction.storeCredit.toFixed(2)}</p>
          )}
          <p className="total"><strong>Total:</strong> ${transaction.total.toFixed(2)}</p>
          
          {transaction.customer && transaction.customer.storeCredit !== undefined && (
            <p className="store-credit-balance">
              <strong>Current Store Credit Balance:</strong> ${transaction.customer.storeCredit.toFixed(2)}
            </p>
          )}
        </div>
        
        <div className="receipt-footer">
          <p>Thank you for your business!</p>
          <p>Return policy: Items can be returned within 30 days with receipt.</p>
          <p>Visit us online at www.yourstore.com</p>
        </div>
      </div>
      
      <div className="receipt-actions">
        <button 
          onClick={generatePdfReceipt} 
          disabled={generatingPdf}
          className="primary"
        >
          {generatingPdf ? 'Generating PDF...' : 'Download PDF Receipt'}
        </button>
        
        <button 
          onClick={sendEmailReceipt} 
          disabled={generatingEmail || !transaction.customer || !transaction.customer.email}
          className="secondary"
        >
          {generatingEmail ? 'Sending Email...' : 'Email Receipt'}
        </button>
      </div>
    </div>
  );
};

export default ReceiptGenerator; 