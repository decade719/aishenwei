// 动态内容加载器 - 从localStorage加载管理员更新的内容

// 成员页面动态加载
function loadDynamicMembers() {
  try {
    // 先确保 dataManager 已初始化
    if (!window.dataManager) {
      console.log('数据管理器未初始化，保留静态内容');
      return;
    }

    // 获取成员数据
    const members = window.dataManager.getMembers();

    // 如果数据为空或太少，不覆盖静态内容
    if (!Array.isArray(members) || members.length < 3) {
      console.log('成员数据不足或格式异常，保留静态内容');
      return;
    }

    // 过滤掉"洪英"（如果存在）
    const filteredMembers = members.filter(m => m && m.name !== '洪英' && m.id !== 'hongying');

    if (filteredMembers.length < 3) {
      console.log('过滤后成员数据不足，保留静态内容');
      return;
    }

    // 按照order排序（容错）
    filteredMembers.sort((a, b) => ((a && a.order) || 0) - ((b && b.order) || 0));

    // 分组（容错）
    const leaders = filteredMembers.filter(m => {
      const title = (m && m.title) ? m.title : '';
      const role = (m && m.role) ? m.role : '';
      return role.includes('负责人') || role.includes('实验室负责人') || title.includes('教授') || title.includes('副教授');
    });
    const doctorals = filteredMembers.filter(m => {
      const title = (m && m.title) ? m.title : '';
      return (((title.includes('博士') && !title.includes('硕士')) || title.includes('博士后') || title.includes('Ph.D')));
    }).filter(m => !leaders.includes(m));
    const masters = filteredMembers.filter(m => {
      const title = (m && m.title) ? m.title : '';
      return (title.includes('硕士') || (title.includes('研究生') && !leaders.includes(m)));
    });

    // 更新教授/负责人部分（支持多位导师）
    const professorCard = document.querySelector('[data-anchor="professor"] .container .reveal');
    if (professorCard && leaders.length > 0) {
      const container = professorCard.parentElement;
      container.innerHTML = leaders.map(renderProfessorCard).join('');
    }

    // 获取容器
    const doctoralGrid = document.getElementById('doctoral-team-grid');
    const masterGrid = document.getElementById('master-team-grid');

    // 仅当有数据时才覆盖静态内容，避免出现空白
    if (doctoralGrid && doctorals.length > 0) {
      doctoralGrid.innerHTML = '';
      doctorals.forEach((member, index) => {
        doctoralGrid.innerHTML += renderDoctoralMember(member, index * 0.05);
      });
    }

    if (masterGrid && masters.length > 0) {
      masterGrid.innerHTML = '';
      masters.forEach((member, index) => {
        masterGrid.innerHTML += renderMasterMember(member, index * 0.05);
      });
    }

    // 仅当静态内容本身为空且无数据时才隐藏
    const doctoralSection = document.getElementById('doctoral-team-section');
    const masterSection = document.getElementById('master-team-section');

    if (doctoralSection && doctorals.length === 0) {
      const hasStaticDoctoral = (document.querySelector('#doctoral-team-grid')?.children?.length || 0) > 0;
      if (!hasStaticDoctoral) doctoralSection.style.display = 'none';
    }
    if (masterSection && masters.length === 0) {
      const hasStaticMaster = (document.querySelector('#master-team-grid')?.children?.length || 0) > 0;
      if (!hasStaticMaster) masterSection.style.display = 'none';
    }
  } catch (err) {
    console.warn('成员动态加载失败，将保留静态内容', err);
  }
}

// 渲染教授/负责人卡片
function renderProfessorCard(member) {
  return `
    <div class="reveal" onclick="window.location.href='member-profile.html?id=${member.id}'" style="background: white; border-radius: 32px; padding: 50px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); position: relative; overflow: hidden; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 25px 70px rgba(0,0,0,0.18)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'">
      <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; opacity: 0.1;"></div>
      <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 40px;">
        <div style="flex-shrink: 0;">
          <div style="width: 160px; height: 160px; border-radius: 50%; overflow: hidden; border: 5px solid #fbbf24; box-shadow: 0 15px 40px rgba(251,191,36,0.4); position: relative;">
            <img src="${member.avatar}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: -5px; right: -5px; width: 45px; height: 45px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(220,38,38,0.5);">
              <span style="color: white; font-size: 18px;">🏆</span>
            </div>
          </div>
        </div>
        <div style="flex: 1;">
          <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 14px;">
            ${member.title}${member.title.includes('副教授') ? ' · Associate Professor' : ' · Professor'}
          </div>
          <h3 style="font-size: 28px; color: #1a202c; margin-bottom: 10px; font-weight: 800;">${member.name}</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            ${member.tags.map(tag => `<span style="background: #fef3c7; color: #92400e; padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 600;">${tag}</span>`).join('')}
          </div>
          <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin-bottom: 18px;">${member.bio || ''}</p>
        </div>
      </div>
    </div>
  `;
}

// 渲染博士成员卡片
function renderDoctoralMember(member, delay) {
  return `
    <div class="reveal" onclick="window.location.href='member-profile.html?id=${member.id}'" style="--d:${delay}s; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 24px; padding: 40px; box-shadow: 0 15px 50px rgba(59,130,246,0.15); border: 3px solid #93c5fd; transition: all 0.3s; position: relative; overflow: hidden; cursor: pointer;" onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 20px 60px rgba(59,130,246,0.25)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 15px 50px rgba(59,130,246,0.15)'">
      <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); border-radius: 50%; opacity: 0.15;"></div>
      <div style="position: relative; z-index: 1;">
        <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 5px solid #3b82f6; margin: 0 auto 24px; box-shadow: 0 10px 30px rgba(59,130,246,0.3);">
          <img src="${member.avatar}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 5px 16px; border-radius: 16px; font-size: 12px; font-weight: 700; margin-bottom: 12px;">
            ${member.title}
          </div>
          <h3 style="font-size: 24px; color: #1e40af; margin-bottom: 8px; font-weight: 700;">${member.name}</h3>
          <p style="color: #60a5fa; font-size: 14px; margin-bottom: 20px;">${member.role || ''}</p>
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
          ${member.tags.map(tag => `<span style="background: white; color: #1e40af; padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 600;">${tag}</span>`).join('')}
        </div>
        <p style="color: #1e3a8a; font-size: 14px; line-height: 1.7; text-align: center;">${member.bio || ''}</p>
      </div>
    </div>
  `;
}

// 渲染硕士成员卡片
function renderMasterMember(member, delay) {
  return `
    <div class="reveal" onclick="window.location.href='member-profile.html?id=${member.id}'" style="--d:${delay}s; background: white; border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(16,185,129,0.12); border: 2px solid #a7f3d0; text-align: center; transition: transform 0.3s; cursor: pointer;" onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 15px 50px rgba(16,185,129,0.25)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 10px 40px rgba(16,185,129,0.12)'">
      <div style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 4px solid #10b981; margin: 0 auto 20px; box-shadow: 0 8px 25px rgba(16,185,129,0.25);">
        <img src="${member.avatar}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 14px; font-size: 11px; font-weight: 700; margin-bottom: 12px;">${member.title}</div>
      <h3 style="font-size: 20px; color: #065f46; margin-bottom: 6px; font-weight: 700;">${member.name}</h3>
      <p style="color: #10b981; font-size: 13px; margin-bottom: 16px;">${member.role || ''}</p>
      <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
        ${member.tags.map(tag => `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">${tag}</span>`).join('')}
      </div>
    </div>
  `;
}

// 产品菜单动态加载（首页导航栏）
function loadDynamicProducts() {
  const productsData = localStorage.getItem('siteProducts');
  if (!productsData) return;

  const products = JSON.parse(productsData);
  const productMenus = document.querySelectorAll('.has-sub .sub');

  productMenus.forEach(menu => {
    // 检查是否是产品菜单（包含智能导航轮椅等）
    const menuText = menu.innerHTML;
    if (!menuText.includes('智能导航轮椅') && !menuText.includes('智能运货小车') && !menuText.includes('🦽')) {
      return;
    }

    menu.innerHTML = '';
    products.sort((a, b) => (a.order || 0) - (b.order || 0));

    products.forEach(product => {
      const link = document.createElement('a');
      link.href = product.link;
      link.textContent = `${product.icon} ${product.name}`;

      if (product.status !== 'available') {
        link.onclick = function(e) {
          e.preventDefault();
          if (typeof showModal === 'function') {
            showModal(product.name, product.description);
          } else {
            alert(product.description);
          }
          return false;
        };
      }

      menu.appendChild(link);
    });
  });
}

// 在DOM加载完成后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDynamicContent);
} else {
  initDynamicContent();
}

// 首页成员列表动态加载
function loadHomeMembers() {
  if (!window.dataManager) {
    return;
  }

  const members = window.dataManager.getMembers();
  if (!members || members.length < 3) {
    return;
  }

  // 过滤掉"洪英"（如果存在）
  const filteredMembers = members.filter(m => m && m.name !== '洪英' && m.id !== 'hongying');

  if (filteredMembers.length < 3) {
    return;
  }

  const membersScroll = document.querySelector('.members-scroll');
  if (!membersScroll) return;

  // 按照order排序
  filteredMembers.sort((a, b) => (a.order || 0) - (b.order || 0));

  // 清空并重新渲染（保留前3个作为示例，或者全部显示）
  membersScroll.innerHTML = '';

  filteredMembers.forEach(member => {
    // 判断是教授、副教授、博士还是硕士
    let bgColor = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
    let borderColor = '#a7f3d0';
    let badgeBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    let badgeText = '📚 硕士';
    let textColor = '#065f46';

    if (member.role.includes('负责人') || (member.title.includes('教授') && !member.title.includes('副'))) {
      bgColor = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      borderColor = '#f59e0b';
      badgeBg = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
      badgeText = '👨‍🏫 教授';
      textColor = '#92400e';
    } else if (member.title.includes('副教授')) {
      bgColor = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      borderColor = '#f59e0b';
      badgeBg = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
      badgeText = '👨‍🏫 副教授';
      textColor = '#92400e';
    } else if (member.title.includes('博士') && !member.title.includes('硕士')) {
      bgColor = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
      borderColor = '#93c5fd';
      badgeBg = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      badgeText = '🎓 博士';
      textColor = '#1e40af';
    }

    const card = document.createElement('article');
    card.className = 'card';
    card.style.cssText = `min-width: 300px; min-height: 340px; background: ${bgColor}; border: 3px solid ${borderColor}; position: relative; overflow: hidden; padding: 18px; flex-shrink: 0; cursor: pointer; transition: transform 0.3s;`;
    card.onclick = () => window.location.href = `member-profile.html?id=${member.id}`;
    card.onmouseover = function() { this.style.transform = 'translateY(-6px)'; };
    card.onmouseout = function() { this.style.transform = 'translateY(0)'; };

    card.innerHTML = `
      <div style="position: absolute; top: 12px; right: 12px; background: ${badgeBg}; color: white; padding: 6px 14px; border-radius: 16px; font-size: 11px; font-weight: 700; z-index: 2; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        ${badgeText}
      </div>
      <div class="card-media" style="position: relative; height: 200px; margin-bottom: 14px;">
        <img src="${member.avatar}" alt="${member.name}" loading="lazy" style="background: ${borderColor}; width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
        ${member.role.includes('负责人') ? `
        <div style="position: absolute; bottom: 8px; right: 8px; width: 34px; height: 34px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(220,38,38,0.5);">
          <span style="font-size: 15px;">🏆</span>
        </div>
        ` : ''}
      </div>
      <h3 style="color: ${textColor}; font-weight: 700; font-size: 18px; margin-bottom: 6px;">${member.name}</h3>
      <p style="color: ${textColor}; font-size: 14px;">${member.role || ''} · ${member.tags.slice(0, 2).join('、')}</p>
    `;

    membersScroll.appendChild(card);
  });
}

function initDynamicContent() {
  // 检查当前页面
  const path = window.location.pathname;

  if (path.includes('members.html')) {
    // 延迟一下，确保原始DOM已渲染
    setTimeout(loadDynamicMembers, 100);
  }

  if (path.includes('index.html') || path.endsWith('/') || path === '') {
    // 首页加载成员
    setTimeout(loadHomeMembers, 100);
  }

  // 所有页面都尝试加载动态产品菜单
  setTimeout(loadDynamicProducts, 50);
}

// 导出给需要的页面使用
window.loadDynamicMembers = loadDynamicMembers;
window.loadDynamicProducts = loadDynamicProducts;
window.loadHomeMembers = loadHomeMembers;
