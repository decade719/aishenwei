// 内容管理功能 - 成员和产品的CRUD操作

// ==================== 成员管理 ====================

// 加载成员列表
function loadMembers() {
  const members = window.dataManager.getMembers();
  const membersList = document.getElementById('membersList');

  if (members.length === 0) {
    membersList.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">👥</div>
        <p style="font-size: 16px;">暂无成员</p>
      </div>
    `;
    return;
  }

  membersList.innerHTML = members.map(member => `
    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #667eea;">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 20px;">
        <div style="display: flex; gap: 20px; flex: 1;">
          <img src="${member.avatar}" alt="${member.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea;">
          <div style="flex: 1;">
            <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${member.name}</h3>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
              <strong>${member.title}</strong> · ${member.role}
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
              ${member.tags.map(tag => `<span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">${tag}</span>`).join('')}
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">${member.bio || '暂无简介'}</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-shrink: 0;">
          <button onclick="editMember('${member.id}')" style="background: #dbeafe; color: #1e40af; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;" title="编辑">✏️ 编辑</button>
          <button onclick="deleteMember('${member.id}')" style="background: #fee2e2; color: #dc2626; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;" title="删除">🗑️ 删除</button>
        </div>
      </div>
    </div>
  `).join('');

  // 更新统计卡片中的成员数量
  const memberCountEl = document.getElementById('memberCount');
  if (memberCountEl) {
    memberCountEl.textContent = members.length;
  }
}

// 显示添加成员模态框
function showAddMemberModal() {
  const modal = createMemberModal({
    title: '添加成员',
    submitText: '添加',
    onSubmit: (data) => {
      window.dataManager.addMember(data);
      loadMembers();
      closeModal();
      alert('✅ 成员添加成功！');
    }
  });
  document.body.appendChild(modal);
}

// 编辑成员
function editMember(id) {
  const members = window.dataManager.getMembers();
  const member = members.find(m => m.id === id);
  if (!member) return;

  const modal = createMemberModal({
    title: '编辑成员',
    submitText: '保存',
    data: member,
    onSubmit: (data) => {
      window.dataManager.updateMember(id, data);
      loadMembers();
      closeModal();
      alert('✅ 成员信息已更新！');
    }
  });
  document.body.appendChild(modal);
}

// 删除成员
function deleteMember(id) {
  if (confirm('⚠️ 确定要删除这个成员吗？\n此操作无法撤销！')) {
    window.dataManager.deleteMember(id);
    loadMembers();
    alert('✅ 成员已删除');
  }
}

// 创建成员编辑模态框
function createMemberModal({ title, submitText, data = {}, onSubmit }) {
  const modal = document.createElement('div');
  modal.id = 'memberModal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);';

  modal.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 32px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 24px;">${title}</h3>
      <form id="memberForm">
        <div style="display: grid; gap: 16px;">
          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">姓名 <span style="color: #dc2626;">*</span></label>
            <input type="text" name="name" value="${data.name || ''}" required
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">职称 <span style="color: #dc2626;">*</span></label>
              <input type="text" name="title" value="${data.title || ''}" required
                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">角色 <span style="color: #dc2626;">*</span></label>
              <input type="text" name="role" value="${data.role || ''}" required
                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
            </div>
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">头像URL</label>
            <input type="url" name="avatar" value="${data.avatar || ''}"
              placeholder="https://example.com/avatar.jpg"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">留空将使用默认头像</p>
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">研究领域（用逗号分隔）</label>
            <input type="text" name="tags" value="${(data.tags || []).join(', ')}"
              placeholder="例如：人工智能, 机器学习, 深度学习"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">个人简介</label>
            <textarea name="bio" rows="3"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${data.bio || ''}</textarea>
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="submit" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s;">
            ${submitText}
          </button>
          <button type="button" onclick="closeModal()" style="flex: 1; background: #f3f4f6; color: #374151; padding: 14px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s;">
            取消
          </button>
        </div>
      </form>
    </div>
  `;

  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const memberData = {
      name: formData.get('name'),
      title: formData.get('title'),
      role: formData.get('role'),
      avatar: formData.get('avatar') || `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.get('name')}&backgroundColor=667eea`,
      tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
      bio: formData.get('bio')
    };
    onSubmit(memberData);
  });

  return modal;
}

// ==================== 产品管理 ====================

// 加载产品列表
function loadProducts() {
  const products = window.dataManager.getProducts();
  const productsList = document.getElementById('productsList');

  if (products.length === 0) {
    productsList.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📦</div>
        <p style="font-size: 16px;">暂无产品</p>
      </div>
    `;
    return;
  }

  productsList.innerHTML = products.map(product => `
    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #f093fb;">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 20px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 36px;">${product.icon}</span>
            <div>
              <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 4px;">${product.name}</h3>
              <p style="color: #6b7280; font-size: 13px;">${product.shortDesc}</p>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">${product.description}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            ${(product.features || []).map(feature => `<span style="background: #fce7f3; color: #9d174d; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">${feature}</span>`).join('')}
          </div>
          <div style="margin-top: 12px;">
            <span style="background: ${product.status === 'available' ? '#d1fae5' : '#fef3c7'}; color: ${product.status === 'available' ? '#065f46' : '#92400e'}; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;">
              ${product.status === 'available' ? '✅ 已上线' : '🔧 开发中'}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-shrink: 0;">
          <button onclick="editProduct('${product.id}')" style="background: #dbeafe; color: #1e40af; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;" title="编辑">✏️ 编辑</button>
          <button onclick="deleteProduct('${product.id}')" style="background: #fee2e2; color: #dc2626; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;" title="删除">🗑️ 删除</button>
        </div>
      </div>
    </div>
  `).join('');
}

// 显示添加产品模态框
function showAddProductModal() {
  const modal = createProductModal({
    title: '添加产品',
    submitText: '添加',
    onSubmit: (data) => {
      window.dataManager.addProduct(data);
      loadProducts();
      closeModal();
      alert('✅ 产品添加成功！');
    }
  });
  document.body.appendChild(modal);
}

// 编辑产品
function editProduct(id) {
  const products = window.dataManager.getProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;

  const modal = createProductModal({
    title: '编辑产品',
    submitText: '保存',
    data: product,
    onSubmit: (data) => {
      window.dataManager.updateProduct(id, data);
      loadProducts();
      closeModal();
      alert('✅ 产品信息已更新！');
    }
  });
  document.body.appendChild(modal);
}

// 删除产品
function deleteProduct(id) {
  if (confirm('⚠️ 确定要删除这个产品吗？\n此操作无法撤销！')) {
    window.dataManager.deleteProduct(id);
    loadProducts();
    alert('✅ 产品已删除');
  }
}

// 创建产品编辑模态框
function createProductModal({ title, submitText, data = {}, onSubmit }) {
  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);';

  modal.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 32px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 24px;">${title}</h3>
      <form id="productForm">
        <div style="display: grid; gap: 16px;">
          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">产品名称 <span style="color: #dc2626;">*</span></label>
            <input type="text" name="name" value="${data.name || ''}" required
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">图标 <span style="color: #dc2626;">*</span></label>
              <input type="text" name="icon" value="${data.icon || ''}" required placeholder="🦽"
                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">状态 <span style="color: #dc2626;">*</span></label>
              <select name="status" required
                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: white;">
                <option value="available" ${data.status === 'available' ? 'selected' : ''}>已上线</option>
                <option value="developing" ${data.status === 'developing' ? 'selected' : ''}>开发中</option>
              </select>
            </div>
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">简短描述 <span style="color: #dc2626;">*</span></label>
            <input type="text" name="shortDesc" value="${data.shortDesc || ''}" required
              placeholder="例如：辅助出行 · 情感陪伴"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">详细描述</label>
            <textarea name="description" rows="3"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${data.description || ''}</textarea>
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">功能特性（用逗号分隔）</label>
            <input type="text" name="features" value="${(data.features || []).join(', ')}"
              placeholder="例如：室外导航, 室内避障, 语音交互"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>

          <div>
            <label style="display: block; color: #374151; font-weight: 600; margin-bottom: 8px;">链接地址</label>
            <input type="text" name="link" value="${data.link || ''}"
              placeholder="product_name.html 或 #"
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="submit" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s;">
            ${submitText}
          </button>
          <button type="button" onclick="closeModal()" style="flex: 1; background: #f3f4f6; color: #374151; padding: 14px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s;">
            取消
          </button>
        </div>
      </form>
    </div>
  `;

  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      name: formData.get('name'),
      icon: formData.get('icon'),
      shortDesc: formData.get('shortDesc'),
      description: formData.get('description'),
      features: formData.get('features').split(',').map(f => f.trim()).filter(f => f),
      status: formData.get('status'),
      link: formData.get('link') || '#'
    };
    onSubmit(productData);
  });

  return modal;
}

// ==================== 通用功能 ====================

// 关闭模态框
function closeModal() {
  const modals = document.querySelectorAll('#memberModal, #productModal');
  modals.forEach(modal => modal.remove());
}

// 页面加载时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentManagement);
} else {
  initContentManagement();
}

function initContentManagement() {
  // 初始化数据
  if (window.dataManager) {
    window.dataManager.init();

    // 更新统计卡片
    const members = window.dataManager.getMembers();
    const memberCountEl = document.getElementById('memberCount');
    if (memberCountEl) {
      memberCountEl.textContent = members.length;
    }
  }
}
