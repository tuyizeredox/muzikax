// Monetization Service
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface MonetizationStatus {
  status: 'not_applied' | 'pending' | 'approved' | 'rejected' | 'suspended';
  requirements: {
    followersRequired: number;
    tracksRequired: number;
    currentFollowers: number;
    currentTracks: number;
    requirementsMet: boolean;
  };
  earnings?: {
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    earningsRate: number;
    platformCommission: number;
  };
  applicationDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

interface EarningsReport {
  summary: {
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalPlays: number;
    totalTracks: number;
  };
  trackEarnings: Array<{
    trackId: string;
    trackTitle: string;
    plays: number;
    earnings: number;
  }>;
  payoutHistory: Array<{
    amount: number;
    date: string;
    status: 'processed' | 'pending' | 'failed';
    paymentMethod: string;
    reference: string;
  }>;
  earningsRate: number;
  platformCommission: number;
}

interface PayoutRequest {
  amount: number;
  paymentMethod: string;
}

// Apply for monetization
export const applyForMonetization = async (): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to apply for monetization');
  }
  
  return response.json();
};

// Check monetization status
export const getMonetizationStatus = async (): Promise<MonetizationStatus> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch monetization status');
  }
  
  return response.json();
};

// Request payout
export const requestPayout = async (payoutData: PayoutRequest): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payoutData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request payout');
  }
  
  return response.json();
};

// Get earnings report
export const getEarningsReport = async (startDate?: string, endDate?: string): Promise<EarningsReport> => {
  const token = localStorage.getItem('accessToken');
  
  let url = `${API_URL}/api/monetization/report`;
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch earnings report');
  }
  
  return response.json();
};

// Admin functions
export interface MonetizationRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    creatorType: string;
    followersCount: number;
  };
  status: string;
  followersCount: number;
  tracksCount: number;
  requirementsMet: boolean;
  earningsRate: number;
  platformCommission: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  applicationDate: string;
  approvalDate?: string;
  adminNotes?: string;
  payoutHistory: Array<{
    amount: number;
    date: string;
    status: 'processed' | 'pending' | 'failed';
    paymentMethod: string;
    reference: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Get all monetization records (admin)
export const getAllMonetizationRecords = async (page: number = 1, limit: number = 10, status?: string): Promise<{
  records: MonetizationRecord[];
  page: number;
  pages: number;
  total: number;
}> => {
  const token = localStorage.getItem('accessToken');
  
  let url = `${API_URL}/api/monetization/admin/all?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch monetization records');
  }
  
  return response.json();
};

// Get pending applications (admin)
export const getPendingApplications = async (): Promise<{ records: MonetizationRecord[] }> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/admin/pending`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch pending applications');
  }
  
  return response.json();
};

// Approve monetization (admin)
export const approveMonetization = async (id: string, earningsRate: number = 1.00, platformCommission: number = 20, adminNotes?: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/admin/approve/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      earningsRate,
      platformCommission,
      adminNotes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to approve monetization');
  }
  
  return response.json();
};

// Reject monetization (admin)
export const rejectMonetization = async (id: string, rejectionReason: string, adminNotes?: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/admin/reject/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rejectionReason,
      adminNotes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject monetization');
  }
  
  return response.json();
};

// Process payout (admin)
export const processPayout = async (id: string, payoutId: string, status: 'processed' | 'failed', reference?: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/admin/payout/${id}/${payoutId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status,
      reference
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process payout');
  }
  
  return response.json();
};

// Update earnings rate (admin)
export const updateEarningsRate = async (id: string, earningsRate?: number, platformCommission?: number, adminNotes?: string): Promise<any> => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_URL}/api/monetization/admin/earnings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      earningsRate,
      platformCommission,
      adminNotes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update earnings rate');
  }
  
  return response.json();
};