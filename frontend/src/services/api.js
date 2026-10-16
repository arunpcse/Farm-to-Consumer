const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('freshharvest_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const authService = {
  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('freshharvest_token', data.token);
      localStorage.setItem('freshharvest_user', JSON.stringify(data.user));
    }
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('freshharvest_token', data.token);
      localStorage.setItem('freshharvest_user', JSON.stringify(data.user));
    }
    return data;
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword({ resetToken, newPassword }) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('freshharvest_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('freshharvest_token');
    localStorage.removeItem('freshharvest_user');
  }
};

export const profileService = {
  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateProfile({ name, phone }) {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ name, phone })
    });
    const data = await handleResponse(res);
    if (data.user) {
      localStorage.setItem('freshharvest_user', JSON.stringify(data.user));
    }
    return data;
  },

  async addAddress(address) {
    const res = await fetch(`${API_BASE_URL}/profile/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(address)
    });
    return handleResponse(res);
  },

  async updateAddress(addressId, address) {
    const res = await fetch(`${API_BASE_URL}/profile/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(address)
    });
    return handleResponse(res);
  },

  async deleteAddress(addressId) {
    const res = await fetch(`${API_BASE_URL}/profile/addresses/${addressId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async setDefaultAddress(addressId) {
    const res = await fetch(`${API_BASE_URL}/profile/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const productService = {
  async getProducts({ search = '', category = 'All', page = 1, limit = 6, sortBy = 'newest' } = {}) {
    const params = new URLSearchParams({
      search,
      category,
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });
    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    return handleResponse(res);
  },

  async getProductById(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    return handleResponse(res);
  },

  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/products/categories`);
    return handleResponse(res);
  }
};

export const orderService = {
  async placeOrder(orderData) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(orderData)
    });
    return handleResponse(res);
  },

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/orders?${query}` : `${API_BASE_URL}/orders`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getOrderById(orderId) {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateDeliveryStatus(orderId, status, note = '') {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, note })
    });
    return handleResponse(res);
  },

  async cancelOrder(orderId, reason = '') {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  async getPaymentHistory() {
    const res = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPaymentConfirmation(transactionId) {
    const res = await fetch(`${API_BASE_URL}/payments/txn/${transactionId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const paymentService = {
  async createGatewayOrder({ orderId, amount }) {
    const res = await fetch(`${API_BASE_URL}/payments/create-gateway-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ orderId, amount })
    });
    return handleResponse(res);
  },

  async verifySignature({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const res = await fetch(`${API_BASE_URL}/payments/verify-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature })
    });
    return handleResponse(res);
  },

  async failPayment({ orderId, reason }) {
    const res = await fetch(`${API_BASE_URL}/payments/fail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ orderId, reason })
    });
    return handleResponse(res);
  },

  async retryPayment({ orderId }) {
    const res = await fetch(`${API_BASE_URL}/payments/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ orderId })
    });
    return handleResponse(res);
  },

  async getPaymentStatus(orderId) {
    const res = await fetch(`${API_BASE_URL}/payments/status/${orderId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPaymentHistory() {
    const res = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getPaymentConfirmation(transactionId) {
    const res = await fetch(`${API_BASE_URL}/payments/txn/${transactionId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const farmerService = {
  async getFarmers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/farmers?${query}` : `${API_BASE_URL}/farmers`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getFarmerById(farmerId) {
    const res = await fetch(`${API_BASE_URL}/farmers/${farmerId}`);
    return handleResponse(res);
  },

  async getMyProfile() {
    const res = await fetch(`${API_BASE_URL}/farmers/my/profile`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMyProducts() {
    const res = await fetch(`${API_BASE_URL}/farmers/my/products`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMyOrders() {
    const res = await fetch(`${API_BASE_URL}/farmers/my/orders`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMyEarnings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/farmers/my/earnings?${query}` : `${API_BASE_URL}/farmers/my/earnings`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createOrUpdateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/farmers/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async acceptOrder(orderId, note = '') {
    const res = await fetch(`${API_BASE_URL}/farmers/orders/${orderId}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ note })
    });
    return handleResponse(res);
  },

  async rejectOrder(orderId, reason = '') {
    const res = await fetch(`${API_BASE_URL}/farmers/orders/${orderId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  }
};

export const farmerProductService = {
  async addProduct(productData) {
    const res = await fetch(`${API_BASE_URL}/farmer-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(productData)
    });
    return handleResponse(res);
  },

  async updateProduct(id, productData) {
    const res = await fetch(`${API_BASE_URL}/farmer-products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(productData)
    });
    return handleResponse(res);
  },

  async updateProductStatus(id, status) {
    const res = await fetch(`${API_BASE_URL}/farmer-products/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE_URL}/farmer-products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getMyProducts() {
    const res = await fetch(`${API_BASE_URL}/farmer-products/my`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const bulkOrderService = {
  async createBulkOrder(bulkOrderData) {
    const res = await fetch(`${API_BASE_URL}/bulk-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(bulkOrderData)
    });
    return handleResponse(res);
  },

  async getBulkOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/bulk-orders?${query}` : `${API_BASE_URL}/bulk-orders`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getBulkOrderById(id) {
    const res = await fetch(`${API_BASE_URL}/bulk-orders/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateBulkOrderStatus(id, status, farmerNote = '') {
    const res = await fetch(`${API_BASE_URL}/bulk-orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, farmerNote })
    });
    return handleResponse(res);
  }
};

export const reviewService = {
  async createReview(reviewData) {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(reviewData)
    });
    return handleResponse(res);
  },

  async getFarmerReviews(farmerId) {
    const res = await fetch(`${API_BASE_URL}/reviews/farmer/${farmerId}`);
    return handleResponse(res);
  },

  async getProductReviews(productId) {
    const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
    return handleResponse(res);
  }
};

export const surplusService = {
  async getSurplusListings() {
    const res = await fetch(`${API_BASE_URL}/surplus`);
    return handleResponse(res);
  },

  async createSurplusListing(listingData) {
    const res = await fetch(`${API_BASE_URL}/surplus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(listingData)
    });
    return handleResponse(res);
  },

  async updateSurplusListing(id, updates) {
    const res = await fetch(`${API_BASE_URL}/surplus/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async getMySurplusListings() {
    const res = await fetch(`${API_BASE_URL}/surplus/my`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async runExpireCheck() {
    const res = await fetch(`${API_BASE_URL}/surplus/expire-check`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteSurplusListing(id) {
    const res = await fetch(`${API_BASE_URL}/surplus/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const contactService = {
  async submitInquiry(inquiryData) {
    const res = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(inquiryData)
    });
    return handleResponse(res);
  },

  async getMyInquiries() {
    const res = await fetch(`${API_BASE_URL}/contact/my`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getFarmerInquiries(farmerId) {
    const res = await fetch(`${API_BASE_URL}/contact/farmer/${farmerId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async respondInquiry(id, response) {
    const res = await fetch(`${API_BASE_URL}/contact/${id}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ response })
    });
    return handleResponse(res);
  }
};

export const deliveryService = {
  async getAssignedDeliveries() {
    const res = await fetch(`${API_BASE_URL}/deliveries/assigned`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async trackDeliveryByOrderId(orderId) {
    const res = await fetch(`${API_BASE_URL}/deliveries/track/order/${orderId}`);
    return handleResponse(res);
  },

  async updateDeliveryStatus(id, status, notes = '') {
    const res = await fetch(`${API_BASE_URL}/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, notes })
    });
    return handleResponse(res);
  },

  async getAllDeliveries() {
    const res = await fetch(`${API_BASE_URL}/deliveries/all`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const notificationService = {
  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async markAsRead(id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async markAllAsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};

export const supportService = {
  async submitTicket(ticketData) {
    const res = await fetch(`${API_BASE_URL}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(ticketData)
    });
    return handleResponse(res);
  },

  async getMyTickets() {
    const res = await fetch(`${API_BASE_URL}/support/my`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAllTickets() {
    const res = await fetch(`${API_BASE_URL}/admin/tickets`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async resolveTicket(ticketId, data) {
    const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export const adminService = {
  async getAllUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateUserRole(userId, role) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },

  async verifyFarmer(farmerId, isVerified) {
    const res = await fetch(`${API_BASE_URL}/admin/farmers/${farmerId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ isVerified })
    });
    return handleResponse(res);
  },

  async getAdminStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAllProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/admin/products?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateProductStatus(id, status) {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAllOrders() {
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateOrderStatus(id, orderStatus, note) {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ orderStatus, note })
    });
    return handleResponse(res);
  },

  async getAllSurplus() {
    const res = await fetch(`${API_BASE_URL}/admin/surplus`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteSurplus(id) {
    const res = await fetch(`${API_BASE_URL}/admin/surplus/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAllDeliveries() {
    const res = await fetch(`${API_BASE_URL}/admin/deliveries`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAllInquiries() {
    const res = await fetch(`${API_BASE_URL}/admin/inquiries`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};


