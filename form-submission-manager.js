// 表单提交管理系统 - 使用 localStorage 存储表单数据
// 无需数据库，所有数据存储在浏览器本地存储中

class FormSubmissionManager {
  constructor() {
    this.storageKeys = {
      messages: 'contactMessages',      // 留言表单
      resumes: 'jobApplications',       // 简历投递
      orders: 'productOrders'           // 产品订购
    };
    // Do not write to storage while a visitor is only opening the page.
  }

  // 初始化存储
  init() {
    // Retained for compatibility; collections are created on first save.
  }

  readRecords(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const records = JSON.parse(raw);
    if (!Array.isArray(records)) throw new Error('本机存储的数据格式无效，原数据未被覆盖。');
    return records;
  }

  // 保存留言表单
  saveMessage(data) {
    const messages = this.getMessages();
    const messageData = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      message: data.message || '',
      date: new Date().toLocaleString('zh-CN'),
      timestamp: Date.now(),
      type: 'message'
    };
    messages.push(messageData);
    localStorage.setItem(this.storageKeys.messages, JSON.stringify(messages));
    return messageData;
  }

  // 获取所有留言
  getMessages() {
    return this.readRecords(this.storageKeys.messages);
  }

  // 保存简历投递
  saveResume(data) {
    const resumes = this.getResumes();
    const resumeData = {
      id: 'resume_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      position: data.position || '',
      education: data.education || '',
      introduction: data.introduction || data.intro || '',
      resumeFile: data.resumeFile || data.resume || null,
      date: new Date().toLocaleString('zh-CN'),
      timestamp: Date.now(),
      type: 'resume'
    };
    resumes.push(resumeData);
    localStorage.setItem(this.storageKeys.resumes, JSON.stringify(resumes));
    return resumeData;
  }

  // 获取所有简历
  getResumes() {
    return this.readRecords(this.storageKeys.resumes);
  }

  // 保存产品订购
  saveOrder(data) {
    const orders = this.getOrders();
    const orderData = {
      id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      product: data.product || '',
      productName: this.getProductName(data.product),
      quantity: data.quantity || '',
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      company: data.company || '',
      address: data.address || '',
      notes: data.notes || data.remarks || '',
      date: new Date().toLocaleString('zh-CN'),
      timestamp: Date.now(),
      type: 'order',
      status: 'pending' // pending, processing, completed, cancelled
    };
    orders.push(orderData);
    localStorage.setItem(this.storageKeys.orders, JSON.stringify(orders));
    return orderData;
  }

  // 获取产品名称
  getProductName(productKey) {
    const productMap = {
      'indoor': '室内版智能轮椅',
      'outdoor-nav': '室外导航版智能轮椅',
      'outdoor-wander': '室外漫游版智能轮椅',
      'premium': '至尊版智能轮椅'
    };
    return productMap[productKey] || productKey;
  }

  // 获取所有订单
  getOrders() {
    return this.readRecords(this.storageKeys.orders);
  }

  // 更新订单状态
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem(this.storageKeys.orders, JSON.stringify(orders));
      return order;
    }
    return null;
  }

  // 删除留言
  deleteMessage(id) {
    const messages = this.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem(this.storageKeys.messages, JSON.stringify(filtered));
    return true;
  }

  // 删除简历
  deleteResume(id) {
    const resumes = this.getResumes();
    const filtered = resumes.filter(r => r.id !== id);
    localStorage.setItem(this.storageKeys.resumes, JSON.stringify(filtered));
    return true;
  }

  // 删除订单
  deleteOrder(id) {
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem(this.storageKeys.orders, JSON.stringify(filtered));
    return true;
  }

  // 清空所有留言
  clearMessages() {
    localStorage.setItem(this.storageKeys.messages, JSON.stringify([]));
  }

  // 清空所有简历
  clearResumes() {
    localStorage.setItem(this.storageKeys.resumes, JSON.stringify([]));
  }

  // 清空所有订单
  clearOrders() {
    localStorage.setItem(this.storageKeys.orders, JSON.stringify([]));
  }

  // 获取统计数据
  getStats() {
    return {
      messages: this.getMessages().length,
      resumes: this.getResumes().length,
      orders: this.getOrders().length,
      pendingOrders: this.getOrders().filter(o => o.status === 'pending').length
    };
  }

  // 导出所有数据
  exportAllData() {
    return {
      messages: this.getMessages(),
      resumes: this.getResumes(),
      orders: this.getOrders(),
      exportDate: new Date().toISOString()
    };
  }
}

// 创建全局实例
window.formSubmissionManager = new FormSubmissionManager();
