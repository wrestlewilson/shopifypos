import mongoose from 'mongoose';
const { Schema } = mongoose;

// Customer Schema
const CustomerSchema = new Schema({
  shopifyCustomerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  storeCredit: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    expiryDate: Date,
    lastUpdated: Date
  },
  communicationPreferences: {
    email: {
      marketing: {
        type: Boolean,
        default: false
      },
      transactional: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: false
      }
    },
    sms: {
      marketing: {
        type: Boolean,
        default: false
      },
      transactional: {
        type: Boolean,
        default: false
      },
      alerts: {
        type: Boolean,
        default: false
      }
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    optedOut: {
      type: Boolean,
      default: false
    }
  },
  notes: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastVisit: Date,
  totalSpent: {
    type: Number,
    default: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0
  }
});

// Store Credit Transaction Schema
const StoreCreditTransactionSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['add', 'use', 'expire', 'adjust'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: String,
  reason: String,
  referenceType: {
    type: String,
    enum: ['transaction', 'adjustment', 'expiration', 'system']
  },
  referenceId: String,
  expiryDate: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  storeLocation: String,
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Transaction Schema
const TransactionSchema = new Schema({
  shopifyOrderId: {
    type: String,
    sparse: true,
    index: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'trade', 'consignment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'voided', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    sku: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    tax: {
      type: Number,
      default: 0
    },
    taxExempt: {
      type: Boolean,
      default: false
    },
    discount: {
      type: Number,
      default: 0
    },
    total: Number,
    itemType: {
      type: String,
      enum: ['product', 'service', 'trade_in', 'consignment']
    },
    metadata: Schema.Types.Mixed
  }],
  payments: [{
    method: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'store_credit', 'gift_card', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reference: String,
    metadata: Schema.Types.Mixed
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  storeCredit: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  notes: String,
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: String,
  locationId: {
    type: String,
    required: true
  },
  locationName: String,
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  refunds: [{
    amount: Number,
    reason: String,
    date: Date,
    refundType: {
      type: String,
      enum: ['store_credit', 'original_payment', 'cash']
    },
    items: [{
      itemId: String,
      quantity: Number,
      amount: Number
    }],
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: String
  }]
});

// User Schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  roles: [{
    type: String,
    enum: ['admin', 'manager', 'cashier', 'inventory', 'readonly'],
    default: ['cashier']
  }],
  permissions: [String],
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Role Schema
const RoleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  permissions: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Audit Log Schema
const AuditLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    sparse: true,
    index: true
  },
  details: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create models
const Customer = mongoose.model('Customer', CustomerSchema);
const StoreCreditTransaction = mongoose.model('StoreCreditTransaction', StoreCreditTransactionSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const User = mongoose.model('User', UserSchema);
const Role = mongoose.model('Role', RoleSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// Export models
export {
  Customer,
  StoreCreditTransaction,
  Transaction,
  User,
  Role,
  AuditLog
}; 