// 数据管理模块 - 用于管理员后台编辑网站内容

// 默认成员数据
const defaultMembers = [
  {
    id: 'zhangtaohong',
    name: '张桃红',
    title: '教授',
    role: '实验室负责人',
    avatar: 'pictures/老师.JPG',
    tags: ['具身智能', '机器人导航', '智能感知'],
    bio: '实验室创始人与学术带头人，专注于具身智能、机器人导航与环境感知领域的前沿研究',
    order: 1
  },
  {
    id: 'xingbowen',
    name: '邢博文',
    title: '副教授',
    role: '学术顾问',
    avatar: 'pictures/老师.webp',
    tags: ['大语言模型', '自然语言处理'],
    bio: '长期从事人工智能和自然语言处理的前沿研究，专注于基于大语言模型的异构语言信息处理及其在垂直领域的应用',
    order: 1.5
  },
  {
    id: 'yuchunlin',
    name: '俞纯林',
    title: '博士',
    role: 'SLAM算法研究',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=YuChunlin&backgroundColor=3b82f6',
    tags: ['SLAM算法', '视觉导航', '路径规划'],
    bio: '专注于SLAM算法研究与视觉导航系统开发，在多传感器融合定位方面有深入研究',
    order: 2
  },
  {
    id: 'wanghaoyu',
    name: '王浩宇',
    title: '博士',
    role: '深度学习研究',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=WangHaoyu&backgroundColor=2563eb',
    tags: ['深度学习', '环境感知', '智能避障'],
    bio: '研究方向为深度学习与环境感知，致力于提升机器人在复杂环境下的智能避障能力',
    order: 3
  },
  {
    id: 'libotao',
    name: '李博涛',
    title: '硕士研究生',
    role: '机器学习研究',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LiBotao&backgroundColor=10b981',
    tags: ['机器学习', '数据分析'],
    bio: '机器学习与数据分析方向研究者，专注于智能算法在机器人系统中的应用',
    order: 4
  },
  {
    id: 'xiachenglong',
    name: '夏成龙',
    title: '硕士研究生',
    role: '嵌入式开发',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=XiaChenglong&backgroundColor=059669',
    tags: ['嵌入式系统', '硬件开发'],
    bio: '嵌入式系统与硬件集成方向研究者，专注于机器人底层控制与硬件开发',
    order: 5
  },
  {
    id: 'chenzhen',
    name: '陈震',
    title: '硕士研究生',
    role: '软件工程',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ChenZhen&backgroundColor=14b8a6',
    tags: ['控制算法', '系统集成'],
    bio: '软件工程与系统架构方向研究者，专注于机器人软件系统开发',
    order: 6
  },
  {
    id: 'lin',
    name: '临',
    title: '硕士研究生',
    role: '语音交互',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lin&backgroundColor=22c55e',
    tags: ['语音识别', 'NLP'],
    bio: '自然语言处理与语音交互方向研究者，专注于大模型应用',
    order: 7
  },
  {
    id: 'xulonglong',
    name: '许龙龙',
    title: '硕士研究生',
    role: '图像处理',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=XuLonglong&backgroundColor=16a34a',
    tags: ['图像处理', '粗糙度检测'],
    bio: '图像处理与特征提取方向研究者，专注于工业视觉检测',
    order: 8
  },
  {
    id: 'zhuzhuangzhuang',
    name: '朱状状',
    title: '硕士研究生',
    role: '系统测试',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZhuZhuangzhuang&backgroundColor=15803d',
    tags: ['云平台', '数据管理'],
    bio: '系统测试与质量保障方向研究者，专注于机器人系统可靠性',
    order: 9
  },
  {
    id: 'ganyutong',
    name: '甘语桐',
    title: '硕士研究生',
    role: '前端开发',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=GanYutong&backgroundColor=34d399',
    tags: ['前端开发', 'UI/UX设计'],
    bio: 'Web开发与人机交互界面设计方向研究者',
    order: 10
  }
];

// 默认产品数据
const defaultProducts = [
  {
    id: 'wheelchair',
    name: '智能导航轮椅',
    icon: '🦽',
    shortDesc: '辅助出行 · 情感陪伴',
    description: '集成多传感器融合、大模型语音交互、情感陪伴等功能的智能轮椅系统',
    features: ['室外导航', '室内避障', '语音交互', '情感陪伴', '坡道辅助'],
    status: 'available',
    link: 'product_chair.html',
    order: 1
  },
  {
    id: 'cargo-cart',
    name: '智能运货小车',
    icon: '🚚',
    shortDesc: '高效物流 · 智能配送',
    description: '该产品正在开发中，敬请期待！智能运货小车即将上线，为您提供高效的物流解决方案。',
    features: ['自动导航', '货物识别', '路径优化'],
    status: 'developing',
    link: '#',
    order: 2
  },
  {
    id: 'food-cart',
    name: '智能餐车',
    icon: '🍽️',
    shortDesc: '智能送餐 · 卫生高效',
    description: '该产品正在开发中，敬请期待！智能餐车即将上线，为您提供智能化的餐饮配送服务。',
    features: ['自动送餐', '保温控制', '消毒功能'],
    status: 'developing',
    link: '#',
    order: 3
  }
];

// 数据管理类
class DataManager {
  constructor() {
    this.init();
  }

  // 初始化数据
  init() {
    if (!localStorage.getItem('siteMembers')) {
      localStorage.setItem('siteMembers', JSON.stringify(defaultMembers));
    } else {
      // 合并缺失的默认成员（不覆盖已有数据），确保原始页面不空
      try {
        const current = JSON.parse(localStorage.getItem('siteMembers')) || [];
        // 删除"洪英"（如果存在）
        const filtered = current.filter(m => m && m.name !== '洪英' && m.id !== 'hongying');
        let changed = filtered.length !== current.length;

        defaultMembers.forEach(dm => {
          if (!filtered.some(m => m && m.id === dm.id)) {
            filtered.push(dm);
            changed = true;
          }
        });
        if (changed) localStorage.setItem('siteMembers', JSON.stringify(filtered));
      } catch (e) {
        console.warn('成员数据合并失败，使用默认成员');
        localStorage.setItem('siteMembers', JSON.stringify(defaultMembers));
      }
    }
    if (!localStorage.getItem('siteProducts')) {
      localStorage.setItem('siteProducts', JSON.stringify(defaultProducts));
    }
  }

  // 获取成员列表
  getMembers() {
    const data = localStorage.getItem('siteMembers');
    return data ? JSON.parse(data) : defaultMembers;
  }

  // 保存成员列表
  saveMembers(members) {
    localStorage.setItem('siteMembers', JSON.stringify(members));
  }

  // 添加成员
  addMember(member) {
    const members = this.getMembers();
    member.id = member.id || 'member_' + Date.now();
    member.order = members.length + 1;
    members.push(member);
    this.saveMembers(members);
    return member;
  }

  // 更新成员
  updateMember(id, updates) {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      members[index] = { ...members[index], ...updates };
      this.saveMembers(members);
      return members[index];
    }
    return null;
  }

  // 删除成员
  deleteMember(id) {
    let members = this.getMembers();
    members = members.filter(m => m.id !== id);
    this.saveMembers(members);
    return true;
  }

  // 获取产品列表
  getProducts() {
    const data = localStorage.getItem('siteProducts');
    return data ? JSON.parse(data) : defaultProducts;
  }

  // 保存产品列表
  saveProducts(products) {
    localStorage.setItem('siteProducts', JSON.stringify(products));
  }

  // 添加产品
  addProduct(product) {
    const products = this.getProducts();
    product.id = product.id || 'product_' + Date.now();
    product.order = products.length + 1;
    products.push(product);
    this.saveProducts(products);
    return product;
  }

  // 更新产品
  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
      return products[index];
    }
    return null;
  }

  // 删除产品
  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    this.saveProducts(products);
    return true;
  }

  // 重置为默认数据
  resetToDefault() {
    localStorage.setItem('siteMembers', JSON.stringify(defaultMembers));
    localStorage.setItem('siteProducts', JSON.stringify(defaultProducts));
  }

  // 导出数据
  exportData() {
    return {
      members: this.getMembers(),
      products: this.getProducts(),
      exportDate: new Date().toISOString()
    };
  }

  // 导入数据
  importData(data) {
    if (data.members) {
      this.saveMembers(data.members);
    }
    if (data.products) {
      this.saveProducts(data.products);
    }
  }
}

// 创建全局实例
window.dataManager = new DataManager();
