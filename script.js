const sitePreferences = {
  getItem(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
  setItem(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
};
// 访前人机验证：拦截未验证访问并保留目标地址
// 注意：已禁用人机验证，如需启用请取消注释下面的代码
/*
(function(){
  const path = location.pathname.split('/').pop().toLowerCase();
  const isVerify = path === 'verify.html';
  const verified = sessionStorage.getItem('human-verified') === 'true';
  if(!verified && !isVerify){
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace('verify.html?next=' + next);
    return;
  }
})();
*/

// 导航：移动端开合 & 头部缩放
(function(){
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  if(toggle){
    toggle.addEventListener('click', ()=>{
      const open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', !open);
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }
  const onScroll = ()=>{
    if(!header) return;
    const shrink = window.scrollY > 10;
    header.setAttribute('data-shrink', String(shrink));
  };
  window.addEventListener('scroll', onScroll, {passive: true}); onScroll();
})();

// 平滑滚动（处理旧浏览器 fallback）
(function(){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth', block:'start'});
        const nav = document.querySelector('.nav');
        nav && nav.setAttribute('data-open', 'false');
        document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();

// 滚动揭示动画
(function(){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal-show'); }});
  }, {threshold: 0.2});
  document.querySelectorAll('.reveal, .card, .slide-card').forEach(el=>observer.observe(el));
})();

// 滑动画廊按钮控制（scroll-snap）
(function(){
  // 支持多个 slider，自动寻找就近的控制按钮
  const sliders = document.querySelectorAll('.slider');
  if(!sliders.length) return;

  const initSlider = (slider)=>{
    // 找到同一区块内的控制按钮
    const section = slider.closest('.section, .hero, .container, section');
    const prevBtn = section ? section.querySelector('.slider-btn.prev') : null;
    const nextBtn = section ? section.querySelector('.slider-btn.next') : null;
    const step = ()=> slider.clientWidth; // 一屏一图

    // 1) 首尾克隆，形成 [lastClone] [真实1..N] [firstClone]
    const cards = Array.from(slider.querySelectorAll('.slide-card'));
    if(cards.length < 1) return;
    const first = cards[0];
    const last = cards[cards.length - 1];
    const firstClone = first.cloneNode(true); firstClone.classList.add('is-clone');
    const lastClone = last.cloneNode(true); lastClone.classList.add('is-clone');
    slider.insertBefore(lastClone, slider.firstChild);
    slider.appendChild(firstClone);

    // 位置索引：可见起点为真实第1张（pos=1），真实区间 [1..N]
    const N = cards.length;
    let pos = 1; // 当前可见的真实卡片位置
    let timer = null;

    // 初始定位到真实第1张（避开首部克隆）
    const jumpTo = (p)=>{ slider.scrollLeft = step() * p; };
    const smoothTo = (p, cb)=>{ slider.scrollTo({left: step() * p, behavior:'smooth'}); if(cb){ setTimeout(cb, 420); } };
    const resizeFix = ()=>{ jumpTo(pos); };
    window.addEventListener('resize', resizeFix);
    // 页面初始进入时，放到真实第一张
    jumpTo(pos);
    // 标记该 slider 已启用循环逻辑，避免重复绑定
    slider.dataset.loop = 'true';

    // 2) 前后切换（保持同方向、无缝循环）
    const next = ()=>{
      pos += 1; // 可能进入末尾的 firstClone
      if(pos === N + 1){
        // 先平滑滚到末尾克隆，再瞬时复位到真实第1张
        smoothTo(pos, ()=>{ pos = 1; jumpTo(pos); });
      }else{
        smoothTo(pos);
      }
    };
    const prev = ()=>{
      pos -= 1; // 可能进入首部的 lastClone
      if(pos === 0){
        // 先平滑滚到首部克隆，再瞬时复位到真实最后一张
        smoothTo(pos, ()=>{ pos = N; jumpTo(pos); });
      }else{
        smoothTo(pos);
      }
    };

    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    // 3) 自动播放：每3.5秒向右滚动一屏（首尾克隆处理）
    const start = ()=>{ stop(); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(next, 3500); };
    const stop = ()=>{ if(timer){ clearInterval(timer); timer=null; } };

    // 用户交互时暂停，移开后恢复
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('touchstart', stop, {passive:true});
    slider.addEventListener('touchend', start);

    // 页面隐藏时暂停，恢复时继续
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stop(); else start(); });

    start();
  };

  sliders.forEach(initSlider);
})();

// 主题切换：持久化 - 确保全局生效
(function(){
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const saved = sitePreferences.getItem('theme');

  // 立即应用保存的主题到整个文档
  if(saved){
    html.setAttribute('data-theme', saved);
  }

  function setTheme(next){
    if(next === 'light'){
      html.setAttribute('data-theme','light');
      sitePreferences.setItem('theme','light');
    } else {
      html.removeAttribute('data-theme');
      sitePreferences.setItem('theme','dark');
    }
    // 更新按钮文案（根据当前语言）
    if(typeof window.updateThemeLabel === 'function'){
      window.updateThemeLabel();
    }
  }

  if(toggle){
    toggle.addEventListener('click', ()=>{
      const currentTheme = html.getAttribute('data-theme');
      const isLight = currentTheme === 'light';
      setTheme(isLight ? 'dark' : 'light');
    });
  }

  // 初始渲染一次按钮文案
  if(typeof window.updateThemeLabel === 'function'){
    window.updateThemeLabel();
  }
})();

// 语言切换：简单 i18n（统一语言码 + 关键文案）
(function(){
  const dict = {
    'zh-cn':{
      title:'USTB · 视觉与智能实验室',
      nav_home:'首页', nav_products:'产品', nav_solutions:'解决方案', nav_cases:'案例', nav_members:'成员', nav_partners:'伙伴',
      nav_product:'产品', nav_more:'更多', nav_sub_about:'关于我们', nav_sub_contact:'联系我们', nav_brand:'深维智能科技-北京科技大学',
      home_title:'基于视觉的智能检测与具身智能',
      home_desc:'我们专注于多特征融合、轻量化网络与机器人视觉，将AI与工业场景深度结合。',
      cta_cases:'查看成果', cta_research:'了解方向',
      research_title:'研究方向', cases_title:'成果案例', patents_title:'已授权部分专利',
      matrix_title:'产品矩阵概览',
      // 主题按钮文案
      toggle_theme:'切换主题', theme_toggle:'切换主题', theme_light:'浅色', theme_dark:'深色',
      // 首页关键文案
      solutions_title:'解决方案', members_title:'成员介绍', partners_title:'合作伙伴', footer_copy:'© 2025 深维智能科技-北京科技大学',
      hero1_title:'具身智能', hero1_desc:'智能感知 · 自主决策',
      hero2_title:'智能轮椅', hero2_desc:'辅助出行 · 情感陪伴',
      hero3_title:'机器人导航', hero3_desc:'精准定位 · 路径规划',
      hero4_title:'工业视觉', hero4_desc:'智能检测 · 质量保障',
      hero5_title:'人机交互', hero5_desc:'语音控制 · 自然对话',
      // 产品页示例
      slider_prev:'上一组', slider_next:'下一组',
      pain_title:'项目背景与市场痛点', users_title:'目标用户分析', market_title:'市场机遇',
      // 产品卡片翻译
      products_title:'核心产品',
      product_flagship:'旗舰产品',
      product_logistics_plan:'物流方案',
      product_catering_service:'餐饮服务',
      product_chair_title:'智能导航轮椅',
      product_chair_desc:'融合SLAM导航、智能避障与大模型语音交互',
      product_truck_title:'智能运货小车',
      product_truck_desc:'自主导航、精准定位、高效搬运',
      product_cart_title:'智能餐车',
      product_cart_desc:'智能送餐、精准路径规划、避障行驶',
      // 产品标签
      tag_smart_nav:'智能导航',
      tag_voice_interaction:'语音交互',
      tag_emotional_companion:'情感陪伴',
      tag_autonomous_nav:'自主导航',
      tag_efficient_handling:'高效搬运',
      tag_multi_scenario:'多场景',
      tag_smart_delivery:'智能送餐',
      tag_path_planning:'路径规划',
      tag_obstacle_avoidance:'避障行驶',
      // 其他界面元素
      coming_soon_title:'敬请期待',
      coming_soon_desc:'更多创新产品正在研发中',
      coming_soon_text:'Coming Soon...',
      modal_development_title:'产品开发中',
      modal_understand:'知道了',
      admin_entrance:'管理员入口',
      // 产品详情页
      product_detail_title:'智能轮椅 · 产品详情',
      product_detail_desc:'面向高龄与行动障碍群体的智能出行设备，融合视觉导航、语音交互、智能避障与物联网联动。',
      feature_outdoor_nav:'室外导航',
      feature_outdoor_nav_detail:'室外导航 · 精准定位与路径规划',
      feature_indoor_obstacle:'室内避障',
      feature_indoor_obstacle_detail:'室内避障 · 智能感知与安全防护',
      feature_voice_interaction:'语音交互',
      feature_voice_interaction_detail:'语音交互 · 大模型赋能的智能对话',
      feature_emotional_companion:'情感陪伴',
      feature_emotional_companion_detail:'情感陪伴 · 有温度的智能伙伴',
      feature_slope_assist:'坡道辅助',
      feature_slope_assist_detail:'坡道辅助 · 智能地形适应系统',
      // 深维智能科技相关
      brand_name:'深维智能科技',
      brand_name_full:'深维智能科技-北京科技大学',
      brand_university:'北京科技大学',
      // 页面标题
      page_title:'深维智能科技',
      page_title_full:'深维智能科技-北京科技大学',
      // 导航菜单
      nav_chair:'智能轮椅',
      nav_truck:'智能运货小车',
      nav_cart:'智能餐车',
      nav_robot:'智能机器人',
      // 语言选择器
      lang_simplified:'简体中文',
      lang_traditional:'繁體中文',
      lang_english:'English',
      'lang.zh_cn':'简体中文',
      'lang.zh_hk':'繁體中文',
      'lang.en':'English',
      // 产品卡片
      product_chair_name:'智能导航轮椅',
      product_chair_feature1:'SLAM导航',
      product_chair_feature2:'智能避障',
      product_chair_feature3:'语音交互',
      product_truck_name:'智能运货小车',
      product_truck_feature1:'自主导航',
      product_truck_feature2:'精准定位',
      product_truck_feature3:'高效搬运',
      product_cart_name:'智能餐车',
      product_cart_feature1:'智能送餐',
      product_cart_feature2:'路径规划',
      product_cart_feature3:'避障行驶',
      // 合作伙伴
      partner_alpha:'Alpha公司',
      partner_beta:'Beta机构',
      partner_gamma:'Gamma集团',
      partner_delta:'Delta实验室',
      partner_alpha_desc:'人工智能芯片提供商',
      partner_beta_desc:'云计算服务合作伙伴',
      partner_gamma_desc:'工业制造集团',
      partner_delta_desc:'智能实验室',
      // 页脚
      footer_copyright:'© 2025 深维智能科技-北京科技大学 版权所有',
      footer_address:'地址：北京市海淀区学院路30号',
      footer_contact:'联系我们',
      footer_phone:'电话：010-62332299',
      footer_email:'邮箱：info@deepwise-tech.com',
      // more.html 页面专用
      embodied_intelligence_title:'具身智能介绍 · 北京科技大学具身智能实验室',
      nav_truck_development:'🚚 智能运货小车',
      nav_cart_development:'🍽️ 智能餐车',
      nav_embodied_intro:'具身智能介绍',
      embodied_intelligence:'具身智能',
      embodied_intelligence_subtitle:'Embodied Intelligence · 智能感知与自主决策的融合',
      what_is_embodied_intelligence:'🤖 什么是具身智能？',
      core_features:'✨ 核心特点',
      multimodal_perception:'🌐 多模态感知',
      // 市场痛点
      pain_complexity:'操作复杂性',
      pain_complexity_desc:'传统电动轮椅多依赖摇杆或按键，学习门槛高，缺乏直观的语音交互功能。',
      pain_safety:'安全隐患',
      pain_safety_desc:'在复杂环境下易发生碰撞或翻侧，缺少有效的智能避障与环境理解。',
      pain_emotional:'情感陪伴缺失',
      pain_emotional_desc:'缺乏与家人或社区的情感连接能力，无法满足陪伴与人机互动需求。',
      pain_functional:'功能单一',
      pain_functional_desc:'仅限基本行驶功能，难以覆盖导航、健康监测、紧急呼叫等多样场景。',
      // 用户需求
      common_needs:'共同需求',
      need_safety:'安全出行',
      need_convenience:'操作便利',
      need_companion:'情感陪伴',
      // 用户分析
      target_users_analysis:'目标用户分析',
      target_users_desc:'智能轮椅项目主要面向行动不便或长期陪伴不到位的人群，包括以下四类核心用户：',
      elderly_lacking_care:'独居或缺乏照料的中老年人',
      elderly_lacking_care_desc:'这部分人群对情感陪伴和紧急情况下的安全保障有强烈诉求。',
      indoor_version:'室内版',
      indoor_version_desc:'专注于室内环境的自主移动',
      outdoor_nav_version:'室外导航版',
      outdoor_nav_version_desc:'专为户外精准导航设计',
      outdoor_wander_version:'室外漫游版',
      outdoor_wander_version_desc:'户外漫游探索体验',
      supreme_version:'至尊版',
      supreme_version_desc:'全功能旗舰配置',
      // 市場痛點
      pain_complexity:'操作複雜性',
      pain_complexity_desc:'傳統電動輪椅多依賴搖桿或按鍵，學習門檻高，缺乏直觀的語音交互功能。',
      pain_safety:'安全隱患',
      pain_safety_desc:'在複雜環境下易發生碰撞或翻側，缺少有效的智能避障與環境理解。',
      pain_emotional:'情感陪伴缺失',
      pain_emotional_desc:'缺乏與家人或社區的情感連接能力，無法滿足陪伴與人機互動需求。',
      pain_functional:'功能單一',
      pain_functional_desc:'僅限基本行駛功能，難以覆蓋導航、健康監測、緊急呼叫等多樣場景。',
      // 用戶需求
      common_needs:'共同需求',
      need_safety:'安全出行',
      need_convenience:'操作便利',
      need_companion:'情感陪伴'
    },
    'zh-hk':{
      title:'USTB · 视觉与智能实验室',
      nav_home:'首頁', nav_products:'產品', nav_solutions:'解決方案', nav_cases:'案例', nav_members:'成員', nav_partners:'合作夥伴',
      nav_product:'產品', nav_more:'更多', nav_sub_about:'關於我們', nav_sub_contact:'聯絡我們', nav_brand:'深維智能科技-北京科技大學',
      home_title:'基於視覺的智能檢測與具身智能',
      home_desc:'我們專注於多特徵融合、輕量化網絡與機器人視覺，將 AI 與工業場景深度結合。',
      cta_cases:'查看成果', cta_research:'了解方向',
      research_title:'研究方向', cases_title:'成果案例', patents_title:'已授權部分專利',
      matrix_title:'產品矩陣概覽',
      toggle_theme:'切換主題', theme_toggle:'切換主題', theme_light:'淺色', theme_dark:'深色',
      solutions_title:'解決方案', members_title:'成員介紹', partners_title:'合作夥伴', footer_copy:'© 2025 北京科技大學具身智能實驗室',
      hero1_title:'具身智能', hero1_desc:'智能感知 · 自主決策',
      hero2_title:'智能輪椅', hero2_desc:'輔助出行 · 情感陪伴',
      hero3_title:'機器人導航', hero3_desc:'精準定位 · 路徑規劃',
      hero4_title:'工業視覺', hero4_desc:'智能檢測 · 質量保障',
      hero5_title:'人機交互', hero5_desc:'語音控制 · 自然對話',
      slider_prev:'上一組', slider_next:'下一組',
      pain_title:'項目背景與市場痛點', users_title:'目標用戶分析', market_title:'市場機遇',
      // 產品卡片翻譯
      products_title:'核心產品',
      product_flagship:'旗艦產品',
      product_logistics_plan:'物流方案',
      product_catering_service:'餐飲服務',
      product_chair_title:'智能導航輪椅',
      product_chair_desc:'融合SLAM導航、智能避障與大模型語音交互',
      product_truck_title:'智能運貨小車',
      product_truck_desc:'自主導航、精準定位、高效搬運',
      product_cart_title:'智能餐車',
      product_cart_desc:'智能送餐、精準路徑規劃、避障行駛',
      // 產品標籤
      tag_smart_nav:'智能導航',
      tag_voice_interaction:'語音交互',
      tag_emotional_companion:'情感陪伴',
      tag_autonomous_nav:'自主導航',
      tag_efficient_handling:'高效搬運',
      tag_multi_scenario:'多場景',
      tag_smart_delivery:'智能送餐',
      tag_path_planning:'路徑規劃',
      tag_obstacle_avoidance:'避障行駛',
      // 其他界面元素
      coming_soon_title:'敬請期待',
      coming_soon_desc:'更多創新產品正在研發中',
      coming_soon_text:'Coming Soon...',
      modal_development_title:'Product Development',
      modal_understand:'Got it',
      admin_entrance:'Admin Entrance',
      // Market pain points
      pain_complexity:'Operational Complexity',
      pain_complexity_desc:'Traditional electric wheelchairs rely on joysticks or buttons, with high learning curves and lack of intuitive voice interaction.',
      pain_safety:'Safety Hazards',
      pain_safety_desc:'Prone to collisions or tipping in complex environments, lacking effective intelligent obstacle avoidance and environmental understanding.',
      pain_emotional:'Lack of Emotional Companionship',
      pain_emotional_desc:'Lacks emotional connection capabilities with family or community, unable to meet companionship and human-computer interaction needs.',
      pain_functional:'Limited Functionality',
      pain_functional_desc:'Limited to basic mobility functions, difficult to cover diverse scenarios like navigation, health monitoring, emergency calls.',
      // User needs
      common_needs:'Common Needs',
      need_safety:'Safe Travel',
      need_convenience:'Convenient Operation',
      need_companion:'Emotional Companionship',
      // User analysis
      target_users_analysis:'Target Users Analysis',
      target_users_desc:'The smart wheelchair project mainly targets people with mobility difficulties or lack of long-term companionship, including the following four core user groups:',
      elderly_lacking_care:'Elderly Living Alone or Lacking Care',
      elderly_lacking_care_desc:'This group has strong demands for emotional companionship and safety assurance in emergency situations.',
      indoor_version:'Indoor Version',
      indoor_version_desc:'Focused on autonomous mobility in indoor environments',
      outdoor_nav_version:'Outdoor Navigation Version',
      outdoor_nav_version_desc:'Designed for precise outdoor navigation',
      outdoor_wander_version:'Outdoor Wander Version',
      outdoor_wander_version_desc:'Outdoor roaming exploration experience',
      supreme_version:'Supreme Version',
      supreme_version_desc:'Full-featured flagship configuration',
      // Product detail page
      product_detail_title:'Smart Wheelchair · Product Details',
      product_detail_desc:'An intelligent mobility device for elderly and mobility-impaired users, integrating visual navigation, voice interaction, intelligent obstacle avoidance and IoT connectivity.',
      feature_outdoor_nav:'Outdoor Navigation',
      feature_outdoor_nav_detail:'Outdoor Navigation · Precise Positioning & Path Planning',
      feature_indoor_obstacle:'Indoor Obstacle Avoidance',
      feature_indoor_obstacle_detail:'Indoor Obstacle Avoidance · Intelligent Perception & Safety Protection',
      feature_voice_interaction:'Voice Interaction',
      feature_voice_interaction_detail:'Voice Interaction · LLM-Powered Intelligent Dialogue',
      feature_emotional_companion:'Emotional Companion',
      feature_emotional_companion_detail:'Emotional Companion · Warm Intelligent Partner',
      feature_slope_assist:'Slope Assistance',
      feature_slope_assist_detail:'Slope Assistance · Intelligent Terrain Adaptation System',
      // 产品详情页
      product_detail_title:'智能輪椅 · 產品詳情',
      product_detail_desc:'面向高齡與行動障礙群體的智能出行設備，融合視覺導航、語音交互、智能避障與物聯網聯動。',
      feature_outdoor_nav:'室外導航',
      feature_outdoor_nav_detail:'室外導航 · 精準定位與路徑規劃',
      feature_indoor_obstacle:'室內避障',
      feature_indoor_obstacle_detail:'室內避障 · 智能感知與安全防護',
      feature_voice_interaction:'語音交互',
      feature_voice_interaction_detail:'語音交互 · 大模型賦能的智能對話',
      feature_emotional_companion:'情感陪伴',
      feature_emotional_companion_detail:'情感陪伴 · 有溫度的智能夥伴',
      feature_slope_assist:'坡道輔助',
      feature_slope_assist_detail:'坡道輔助 · 智能地形適應系統',
      // 深维智能科技相关
      brand_name:'深維智能科技',
      brand_name_full:'深維智能科技-北京科技大學',
      brand_university:'北京科技大學',
      // 页面标题
      page_title:'深維智能科技',
      page_title_full:'深維智能科技-北京科技大學',
      // 导航菜单
      nav_chair:'智能輪椅',
      nav_truck:'智能運貨小車',
      nav_cart:'智能餐車',
      nav_robot:'智能機器人',
      // 语言选择器
      lang_simplified:'簡體中文',
      lang_traditional:'繁體中文',
      lang_english:'English',
      'lang.zh_cn':'簡體中文',
      'lang.zh_hk':'繁體中文',
      'lang.en':'English',
      // 产品卡片
      product_chair_name:'智能導航輪椅',
      product_chair_feature1:'SLAM導航',
      product_chair_feature2:'智能避障',
      product_chair_feature3:'語音交互',
      product_truck_name:'智能運貨小車',
      product_truck_feature1:'自主導航',
      product_truck_feature2:'精準定位',
      product_truck_feature3:'高效搬運',
      product_cart_name:'智能餐車',
      product_cart_feature1:'智能送餐',
      product_cart_feature2:'路徑規劃',
      product_cart_feature3:'避障行駛',
      // 合作伙伴
      partner_alpha:'Alpha公司',
      partner_beta:'Beta機構',
      partner_gamma:'Gamma集團',
      partner_delta:'Delta實驗室',
      partner_alpha_desc:'人工智能芯片提供商',
      partner_beta_desc:'雲計算服務合作夥伴',
      partner_gamma_desc:'工業製造集團',
      partner_delta_desc:'智能實驗室',
      // 页脚
      footer_copyright:'© 2025 深維智能科技-北京科技大學 版權所有',
      footer_address:'地址：北京市海淀區學院路30號',
      footer_contact:'聯絡我們',
      footer_phone:'電話：010-62332299',
      footer_email:'郵箱：info@deepwise-tech.com',
      // more.html 页面专用
      embodied_intelligence_title:'具身智能介紹 · 北京科技大學具身智能實驗室',
      nav_truck_development:'🚚 智能運貨小車',
      nav_cart_development:'🍽️ 智能餐車',
      nav_embodied_intro:'具身智能介紹',
      embodied_intelligence:'具身智能',
      embodied_intelligence_subtitle:'Embodied Intelligence · 智能感知與自主決策的融合',
      what_is_embodied_intelligence:'🤖 什麼是具身智能？'
    },
    'en-us':{
      title:'USTB · Vision & Intelligence Lab',
      nav_home:'Home', nav_products:'Products', nav_solutions:'Solutions', nav_cases:'Cases', nav_members:'Members', nav_partners:'Partners',
      nav_product:'Products', nav_more:'More', nav_sub_about:'About', nav_sub_contact:'Contact', nav_brand:'Shenwei Intelligent Tech - USTB',
      home_title:'Vision-based Intelligent Inspection & Embodied AI',
      home_desc:'We focus on multi-feature fusion, lightweight networks and robotic vision, bringing AI into industrial scenarios.',
      cta_cases:'See Work', cta_research:'Explore Topics',
      research_title:'Research', cases_title:'Showcase', patents_title:'Authorized Patents',
      matrix_title:'Product Matrix',
      toggle_theme:'Theme', theme_toggle:'Theme', theme_light:'Light', theme_dark:'Dark',
      solutions_title:'Solutions', members_title:'Members', partners_title:'Partners', footer_copy:'© 2025 HQ Lab',
      hero1_title:'Embodied Intelligence', hero1_desc:'Smart Perception · Autonomous Decision',
      hero2_title:'Smart Wheelchair', hero2_desc:'Assisted Mobility · Emotional Companionship',
      hero3_title:'Robot Navigation', hero3_desc:'Precise Positioning · Path Planning',
      hero4_title:'Industrial Vision', hero4_desc:'Intelligent Inspection · Quality Assurance',
      hero5_title:'Human-Robot Interaction', hero5_desc:'Voice Control · Natural Dialogue',
      slider_prev:'Previous', slider_next:'Next',
      pain_title:'Background & Pain Points', users_title:'Target Users', market_title:'Market Opportunities',
      // Product card translations
      products_title:'Core Products',
      product_flagship:'Flagship Product',
      product_logistics_plan:'Logistics Solution',
      product_catering_service:'Catering Service',
      product_chair_title:'Smart Navigation Wheelchair',
      product_chair_desc:'Integrates SLAM navigation, intelligent obstacle avoidance and LLM voice interaction',
      product_truck_title:'Smart Delivery Vehicle',
      product_truck_desc:'Autonomous navigation, precise positioning, efficient handling',
      product_cart_title:'Smart Food Cart',
      product_cart_desc:'Smart food delivery, precise path planning, obstacle avoidance',
      // Product tags
      tag_smart_nav:'Smart Navigation',
      tag_voice_interaction:'Voice Interaction',
      tag_emotional_companion:'Emotional Companion',
      tag_autonomous_nav:'Autonomous Navigation',
      tag_efficient_handling:'Efficient Handling',
      tag_multi_scenario:'Multi-Scenario',
      tag_smart_delivery:'Smart Delivery',
      tag_path_planning:'Path Planning',
      tag_obstacle_avoidance:'Obstacle Avoidance',
      // Other interface elements
      coming_soon_title:'Coming Soon',
      coming_soon_desc:'More innovative products are under development',
      coming_soon_text:'Coming Soon...',
      modal_development_title:'Product Development',
      modal_understand:'Got it',
      admin_entrance:'Admin Entrance',
      // 深维智能科技相关
      brand_name:'Shenwei Intelligent Tech',
      brand_name_full:'Shenwei Intelligent Tech - USTB',
      brand_university:'University of Science and Technology Beijing',
      // 页面标题
      page_title:'Shenwei Intelligent Tech',
      page_title_full:'Shenwei Intelligent Tech - USTB',
      // 导航菜单
      nav_chair:'Smart Wheelchair',
      nav_truck:'Smart Delivery Vehicle',
      nav_cart:'Smart Food Cart',
      nav_robot:'Smart Robot',
      // 语言选择器
      lang_simplified:'Simplified Chinese',
      lang_traditional:'Traditional Chinese',
      lang_english:'English',
      'lang.zh_cn':'Simplified Chinese',
      'lang.zh_hk':'Traditional Chinese',
      'lang.en':'English',
      // 产品卡片
      product_chair_name:'Smart Navigation Wheelchair',
      product_chair_feature1:'SLAM Navigation',
      product_chair_feature2:'Intelligent Obstacle Avoidance',
      product_chair_feature3:'Voice Interaction',
      product_truck_name:'Smart Delivery Vehicle',
      product_truck_feature1:'Autonomous Navigation',
      product_truck_feature2:'Precise Positioning',
      product_truck_feature3:'Efficient Handling',
      product_cart_name:'Smart Food Cart',
      product_cart_feature1:'Smart Food Delivery',
      product_cart_feature2:'Path Planning',
      product_cart_feature3:'Obstacle Avoidance',
      // 合作伙伴
      partner_alpha:'Alpha Company',
      partner_beta:'Beta Institution',
      partner_gamma:'Gamma Group',
      partner_delta:'Delta Lab',
      partner_alpha_desc:'AI Chip Provider',
      partner_beta_desc:'Cloud Computing Partner',
      partner_gamma_desc:'Industrial Manufacturing Group',
      partner_delta_desc:'Intelligence Laboratory',
      // 页脚
      footer_copyright:'© 2025 Shenwei Intelligent Tech - USTB All Rights Reserved',
      footer_address:'Address: No.30 Xueyuan Road, Haidian District, Beijing',
      footer_contact:'Contact Us',
      footer_phone:'Phone: +86-10-62332299',
      footer_email:'Email: info@deepwise-tech.com',
      // more.html 页面专用
      embodied_intelligence_title:'Embodied Intelligence Introduction · USTB Embodied Intelligence Lab',
      nav_truck_development:'🚚 Smart Delivery Vehicle',
      nav_cart_development:'🍽️ Smart Food Cart',
      nav_embodied_intro:'Embodied Intelligence Introduction',
      embodied_intelligence:'Embodied Intelligence',
      embodied_intelligence_subtitle:'Embodied Intelligence · Integration of Intelligent Perception and Autonomous Decision',
      what_is_embodied_intelligence:'🤖 What is Embodied Intelligence?'
    }
  };
  // 全局保存字典，便于主题按钮文案更新
  window.__i18nDict = dict;
  function normalize(ext){
    if(!ext) return 'zh-CN';
    const m = ext.toLowerCase();
    if(m==='zh-cn') return 'zh-CN';
    if(m==='zh-hk' || m==='zh-tw') return 'zh-HK';
    if(m==='en' || m==='en-us') return 'en';
    return 'zh-CN';
  }
  function toInternal(ext){
    return ext==='en' ? 'en-us' : (ext==='zh-HK' ? 'zh-hk' : 'zh-cn');
  }
  // 新增：cookie 与 URL 参数支持（跨端口、跨页面）
  function getCookie(name){
    const m = document.cookie.split('; ').find(x=>x.startsWith(name+'='));
    return m ? decodeURIComponent(m.split('=')[1]) : null;
  }
  function setCookie(name, val){
    const oneYear = 60*60*24*365;
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=${oneYear}`;
  }
  function getLangFromQuery(){
    try { return new URLSearchParams(location.search).get('lang'); } catch(e){ return null; }
  }

  const langSelect = document.getElementById('langSelect') || document.getElementById('langSwitcher');
  const savedLangExt = normalize(getLangFromQuery() || getCookie('lang') || sitePreferences.getItem('lang'));

  function lookup(packA, packB, key){
    const k1 = key;
    const k2 = key.replace(/\./g,'_');
    return (packA && (packA[k1] || packA[k2])) || (packB && (packB[k1] || packB[k2])) || null;
  }
  function externalPackFor(ext){
    const e = window.i18n || {};
    if(e[ext]) return e[ext];
    if(ext === 'zh-HK' && e['zh-TW']) return e['zh-TW'];
    if(ext === 'en' && e['en']) return e['en'];
    if(ext === 'zh-CN' && e['zh-CN']) return e['zh-CN'];
    return null;
  }
  function apply(ext){
    const internalKey = ext==='en' ? 'en-us' : (ext==='zh-HK' ? 'zh-hk' : 'zh-cn');
    const pack = dict[internalKey] || dict['zh-cn'];
    const external = externalPackFor(ext);
    window.__lang = ext;
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin === location.origin && /\.html$/.test(url.pathname)) {
          url.searchParams.set('lang', ext);
          link.href = url.href;
        }
      } catch (_) {}
    });
    document.documentElement.lang = ext;
    // Keep the descriptive title authored for each page.


    // 更新所有带有 data-i18n 属性的元素
    let updatedCount = 0;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const val = lookup(pack, external, key);
      if(val != null) {
        el.textContent = val;
        updatedCount++;
      } else {

      }
    });

    sitePreferences.setItem('lang', ext);
    setCookie('lang', ext);

    // 将当前语言写入 URL，方便跨页面传递
    try{
      const url = new URL(location.href);
      url.searchParams.set('lang', ext);
      history.replaceState(null, '', url.toString());
    }catch(e){}

    if(typeof window.updateThemeLabel === 'function'){
      window.updateThemeLabel();
    }
  }
  // 主题按钮文案更新（根据当前主题与语言包）
  window.updateThemeLabel = function(){
    const btn = document.getElementById('themeToggle');
    if(!btn) return;

    const ext = window.__lang || 'zh-CN';
    const internalKey = ext==='en' ? 'en-us' : (ext==='zh-HK' ? 'zh-hk' : 'zh-cn');
    const pack = dict[internalKey] || dict['zh-cn'];
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const newText = isLight ? (pack.theme_dark || '深色') : (pack.theme_light || '浅色');

    btn.textContent = newText;
  };
  // 初始化选择器与应用（两个 id 兼容）
  if(langSelect){
    langSelect.value = savedLangExt;
  }
  const otherSelect = langSelect && langSelect.id === 'langSelect' ? document.getElementById('langSwitcher') : document.getElementById('langSelect');
  if(otherSelect){
    otherSelect.value = savedLangExt;
  }

  // 应用保存的语言设置
  apply(savedLangExt);

  // Debug: 输出当前语言设置


  // 绑定语言切换事件
  if(langSelect){
    langSelect.addEventListener('change', ()=>{
      const v = normalize(langSelect.value);

      apply(v);
      if(otherSelect) {
        otherSelect.value = v;
      }
    });
  }

  if(otherSelect){
    otherSelect.addEventListener('change', ()=>{
      const v = normalize(otherSelect.value);
      apply(v);
      if(langSelect) {
        langSelect.value = v;
      }
    });
  }

  // 新增：为站内页面链接自动附加当前语言参数
  (function propagateLangToLinks(){
    const current = savedLangExt;
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href');
      // 跳过锚点或外链
      // 跳过锚点、javascript、以及任何带协议的外链（http、https、mailto、tel 等）
      if(!href || href.startsWith('#') || /^(?:[a-zA-Z][a-zA-Z0-9+\-.]*:)/.test(href)) return;
      try{
        // 使用 location.href 作为基准，确保在 file:// 场景下保持相对目录不丢失
        const url = new URL(href, location.href);
        // 仅当未设置 lang 时追加
        if(!url.searchParams.get('lang')) url.searchParams.set('lang', current);
        // 直接写入完整绝对地址，避免只取 pathname 导致变成根路径
        a.setAttribute('href', url.toString());
      }catch(e){ /* 忽略不合法 URL */ }
    });
  })();
})();

// 加强按钮磁吸效果（科技感）
(function(){
  document.querySelectorAll('.btn-primary').forEach(btn=>{
    btn.addEventListener('mousemove', (e)=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      btn.style.background = `radial-gradient(120px 120px at ${x}px ${y}px, rgba(255,255,255,.35), transparent), var(--gradient)`;
    });
    btn.addEventListener('mouseleave', ()=>{
      btn.style.background = 'var(--gradient)';
    });
  });
})();

// 追加：新增板块的国际化字典
window.i18n = window.i18n || {};
window.i18n["zh-CN"] = Object.assign({}, window.i18n["zh-CN"] || {}, {
  "coreTechLLM.title": "核心技术二：大模型语音交互",
  "coreTechLLM.lead": "产品引入大语言模型（LLM），极大提升了智能轮椅的语音交互能力，使其超越了传统语音助手的范畴，实现了真正意义上的智能陪伴。",
  "coreTechLLM.system": "大模型语音交互系统能力",
  "coreTechLLM.intent": "意图识别",
  "coreTechLLM.nlu": "自然语言理解",
  "coreTechLLM.emotion": "情感识别",
  "coreTechLLM.companion": "主动陪伴",
  "coreTechLLM.examples": "交互示例",
  "coreTechLLM.advantages": "技术优势",

  "productAdv.title": "产品优势与市场竞争力",
  "productAdv.core": "核心优势四大维度",
  "productAdv.diff": "差异化竞争力分析",

  // 首页解决方案卡片与合作伙伴
  "solutions_aiot_title": "AIoT 场景",
  "solutions_aiot_desc": "连接设备，数据驱动业务增长。",
  "solutions_industry_title": "工业视觉",
  "solutions_industry_desc": "检测识别，提高生产良率。",
  "solutions_retail_title": "智能零售",
  "solutions_retail_desc": "端边云协同，实时分析。",
  "solutions_qa_title": "知识问答",
  "solutions_qa_desc": "企业知识库，语义检索。",
  "partners_alpha_title": "合作方 Alpha",
  "partners_alpha_desc": "芯片与模组。",
  "partners_beta_title": "合作方 Beta",
  "partners_beta_desc": "云服务与平台。",
  "partners_gamma_title": "合作方 Gamma",
  "partners_gamma_desc": "制造与交付。",
  "partners_delta_title": "合作方 Delta",
  "partners_delta_desc": "渠道与生态。",

  "future.title": "未来发展与展望"
});

window.i18n["en"] = Object.assign({}, window.i18n["en"] || {}, {
  "coreTechLLM.title": "Core Tech II: LLM Voice Interaction",
  "coreTechLLM.lead": "Powered by LLM, the wheelchair’s conversational abilities leap beyond traditional voice assistants, enabling true intelligent companionship.",
  "coreTechLLM.system": "LLM Interaction Capabilities",
  "coreTechLLM.intent": "Intent Recognition",
  "coreTechLLM.nlu": "Natural Language Understanding",
  "coreTechLLM.emotion": "Emotion Recognition",
  "coreTechLLM.companion": "Proactive Companion",
  "coreTechLLM.examples": "Dialogue Examples",
  "coreTechLLM.advantages": "Technical Advantages",

  "productAdv.title": "Product Advantages & Competitiveness",
  "productAdv.core": "Four Core Dimensions",
  "productAdv.diff": "Differentiated Competitiveness",

  // Home Solutions & Partners cards
  "solutions_aiot_title": "AIoT Scenario",
  "solutions_aiot_desc": "Connect devices, data-driven business growth.",
  "solutions_industry_title": "Industrial Vision",
  "solutions_industry_desc": "Detection and recognition, improving yield.",
  "solutions_retail_title": "Smart Retail",
  "solutions_retail_desc": "Edge–cloud collaboration, real-time analytics.",
  "solutions_qa_title": "Knowledge Q&A",
  "solutions_qa_desc": "Enterprise knowledge base, semantic search.",
  "partners_alpha_title": "Partner Alpha",
  "partners_alpha_desc": "Chips & modules.",
  "partners_beta_title": "Partner Beta",
  "partners_beta_desc": "Cloud services & platforms.",
  "partners_gamma_title": "Partner Gamma",
  "partners_gamma_desc": "Manufacturing & delivery.",
  "partners_delta_title": "Partner Delta",
  "partners_delta_desc": "Channels & ecosystem.",

  "future.title": "Future Development & Outlook"
});

window.i18n["zh-TW"] = Object.assign({}, window.i18n["zh-TW"] || {}, {
  "coreTechLLM.title": "核心技术二：大模型语音交互",
  "coreTechLLM.lead": "产品引入大语言模型（LLM），极大提升了智能轮椅的语音交互能力，使其超越了传统语音助手的范畴，实现了真正意义上的智能陪伴。",
  "coreTechLLM.system": "大模型语音交互系统能力",
  "coreTechLLM.intent": "意图识别",
  "coreTechLLM.nlu": "自然语言理解",
  "coreTechLLM.emotion": "情感识别",
  "coreTechLLM.companion": "主动陪伴",
  "coreTechLLM.examples": "交互示例",
  "coreTechLLM.advantages": "技术优势",

  "productAdv.title": "产品优势与市场竞争力",
  "productAdv.core": "核心优势四大维度",
  "productAdv.diff": "差异化竞争力分析",

  "future.title": "未来发展与展望"
});

// Navigation and header scrolling are initialized once at the top of this file.

// 滚动揭示
(function(){
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal-show'); io.unobserve(e.target);} });
  },{threshold:.12});
  reveals.forEach(el=>io.observe(el));
})();

// 简易轮播（水平滚动 + 左右按钮）
(function(){
  const sliders = document.querySelectorAll('.slider-wrap');
  sliders.forEach((wrap)=>{
    const slider = wrap.querySelector('.slider');
    const prev = wrap.querySelector('.slider-btn.prev');
    const next = wrap.querySelector('.slider-btn.next');
    // 若已启用循环逻辑，则跳过此简易绑定
    if(!slider || !prev || !next || slider.dataset.loop === 'true') return;
    const cardWidth = ()=>slider.clientWidth;
    const scrollTo = (dx)=> slider.scrollBy({left:dx, behavior:'smooth'});
    prev.addEventListener('click', ()=>scrollTo(-cardWidth()));
    next.addEventListener('click', ()=>scrollTo(cardWidth()));
  });
})();

// 滑块认证：拖动到尽头即解锁
(function(){
  const captcha = document.querySelector('.slide-captcha');
  if(!captcha) return;
  const track = captcha.querySelector('.captcha-track');
  const thumb = captcha.querySelector('.captcha-thumb');
  const progress = captcha.querySelector('.captcha-progress');
  const status = captcha.querySelector('.captcha-status');
  const heroControls = document.querySelector('.hero .slider-controls');
  const caseControls = document.querySelector('#cases .slider-controls');
  const disableButtons = (disabled)=>{
    [heroControls, caseControls].forEach(ctrl=>{
      if(!ctrl) return;
      ctrl.querySelectorAll('.slider-btn').forEach(btn=>{
        btn.disabled = disabled;
      });
    });
  };
  disableButtons(true);
  let startX = 0; let offset = 0; let dragging=false;
  const max = ()=> track.clientWidth - thumb.clientWidth;
  const setPos = (x)=>{
    offset = Math.max(0, Math.min(max(), x));
    thumb.style.transform = `translateX(${offset}px)`;
    progress.style.width = `${offset + thumb.clientWidth/2}px`;
  };
  const onDown = (e)=>{
    dragging = true; startX = (e.touches? e.touches[0].clientX : e.clientX) - offset;
  };
  const onMove = (e)=>{
    if(!dragging) return;
    const x = (e.touches? e.touches[0].clientX : e.clientX) - startX;
    setPos(x);
  };
  const onUp = ()=>{
    if(!dragging) return; dragging=false;
    if(offset >= max() - 4){
      status.textContent = '验证通过，正在进入';
      sessionStorage.setItem('human-verified','true');
      disableButtons(false);
      thumb.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      thumb.style.color = '#fff';
      thumb.style.pointerEvents = 'none';
      const params = new URLSearchParams(location.search);
      const target = params.get('next') || 'index.html';
      setTimeout(()=>{ location.replace(target); }, 400);
    }else{
      status.textContent = '请拖动滑块到最右端以解锁';
      setPos(0);
    }
  };
  thumb.addEventListener('mousedown', onDown);
  thumb.addEventListener('touchstart', onDown,{passive:true});
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove,{passive:false});
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
})();

// 保留原交互：导航、滚动显隐、滑块认证等（如存在）
(function(){
  const header=document.querySelector('.site-header');
  let lastTop=0;
  window.addEventListener('scroll',()=>{
    const t=window.scrollY;
    header && header.setAttribute('data-shrink', String(t>40));
    lastTop=t;
  },{passive:true});

  const nav=document.getElementById('mainNav');
  const toggle=document.getElementById('navToggle');
  if(toggle){
    toggle.addEventListener('click',()=>{
      const open=nav.getAttribute('data-open')==='true';
      nav.setAttribute('data-open', String(!open));
    });
  }

  // 通用横向滑动控件（案例区）
  const caseSlider=document.getElementById('caseSlider');
  const casePrev=document.getElementById('casePrev');
  const caseNext=document.getElementById('caseNext');
  if(caseSlider && casePrev && caseNext){
    // 若已启用循环逻辑，则不再重复绑定回退逻辑
    if(caseSlider.dataset.loop === 'true') return;
    const scrollBy=()=>{
      caseSlider.scrollBy({left: caseSlider.clientWidth, behavior:'smooth'});
    }
    casePrev.addEventListener('click',()=>{
      caseSlider.scrollBy({left:-caseSlider.clientWidth, behavior:'smooth'});
    });
    caseNext.addEventListener('click',scrollBy);
  }
})();
// 智能轮椅产品页：横向面板展开交互
(function(){
  const gallery = document.querySelector('.panel-gallery');
  if(!gallery) return;
  const panels = Array.from(gallery.querySelectorAll('.panel'));

  // 将img标签的src设置为panel的背景图
  panels.forEach((panel) => {
    const img = panel.querySelector('img');
    if(img && img.src) {
      panel.style.backgroundImage = `url('${img.src}')`;
    }
  });

  // 点击在画廊内扩展（非全屏），只展开一个
  function collapseAll(){
    panels.forEach((p) => {
      p.classList.remove('expanded');
    });
    delete gallery.dataset.mode; // 退出展开模式，恢复平均分布
  }

  panels.forEach((panel) => {
    panel.tabIndex = 0;
    panel.setAttribute('role', 'button');
    panel.setAttribute('aria-label', panel.querySelector('h3')?.textContent || '查看产品功能');
    panel.addEventListener('keydown', event => {
      if (event.target === panel && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        panel.click();
      }
    });
    panel.addEventListener('click', (e) => {
      const isCloseBtn = e.target.closest('.close');
      if(isCloseBtn){ collapseAll(); return; }
      const already = panel.classList.contains('expanded');
      collapseAll();
      if(!already){
        panel.classList.add('expanded');
        gallery.dataset.mode = 'expanded';
      }
    });
  });

  // Esc关闭
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') collapseAll();
  });
})();
