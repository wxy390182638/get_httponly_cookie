// 当弹出窗口加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const httpOnlyContainer = document.getElementById('httpOnlyContainer');
  const getHttpOnlyButton = document.getElementById('getHttpOnly');
  const copyHttpOnlyButton = document.getElementById('copyHttpOnly');
  const statusElement = document.getElementById('status');
  
  // 存储HTTP-only cookie的变量
  let httpOnlyCookies = null;
  
  // 添加事件监听器
  getHttpOnlyButton.addEventListener('click', loadHttpOnlyCookies);
  copyHttpOnlyButton.addEventListener('click', copyHttpOnlyCookies);
  
  // 添加调试日志
  console.log('事件监听器已添加');
  console.log('- 获取按钮:', getHttpOnlyButton);
  console.log('- 复制HTTP-only按钮:', copyHttpOnlyButton);

  /**
   * 加载HTTP-only cookie
   */
  function loadHttpOnlyCookies() {
    // 显示加载状态
    httpOnlyContainer.innerHTML = '<div class="no-cookies">加载中...</div>';
    showStatus('正在请求HTTP-only cookie...');
    console.log('发送获取HTTP-only cookie请求...');
    
    // 向后台脚本发送消息，请求获取HTTP-only cookie
    chrome.runtime.sendMessage(
      {action: 'getHttpOnlyCookies'},
      function(response) {
        console.log('收到后台响应:', response);
        if (chrome.runtime.lastError) {
          showError('获取Cookie失败: ' + chrome.runtime.lastError.message);
          httpOnlyContainer.innerHTML = '<div class="no-cookies">获取失败，请确保已打开网页</div>';
          return;
        }
        
        if (!response || !response.success) {
          showError(response.error || '获取Cookie失败');
          httpOnlyContainer.innerHTML = '<div class="no-cookies">获取失败，请确保已打开网页</div>';
          return;
        }
        
        // 保存并显示cookie
        httpOnlyCookies = response.httpOnlyCookies;
        displayHttpOnlyCookies(httpOnlyCookies);
        
        // 显示成功状态
        showStatus(`成功获取 ${httpOnlyCookies.totalCount} 个HTTP-only Cookie`);
      }
    );
  }
  
  /**
   * 在界面上显示HTTP-only cookie列表
   * @param {Object} data - HTTP-only cookie数据
   */
  function displayHttpOnlyCookies(data) {
    // 清空容器
    httpOnlyContainer.innerHTML = '';
    
    if (!data || (!data.cookies || data.cookies.length === 0) && !data.capturedFromRequests) {
      httpOnlyContainer.innerHTML = '<div class="no-cookies">没有找到HTTP-only Cookie</div>';
      return;
    }
    
    // 创建URL信息元素
    const urlInfo = document.createElement('div');
    urlInfo.className = 'cookie-details';
    urlInfo.textContent = `URL: ${data.url}`;
    httpOnlyContainer.appendChild(urlInfo);
    
    // 创建时间戳信息元素
    const timestampInfo = document.createElement('div');
    timestampInfo.className = 'cookie-details';
    timestampInfo.textContent = `获取时间: ${new Date(data.timestamp).toLocaleString()}`;
    httpOnlyContainer.appendChild(timestampInfo);
    
    // 添加来源信息
    if (data.capturedFromRequests) {
      const sourceInfo = document.createElement('div');
      sourceInfo.className = 'cookie-details';
      sourceInfo.innerHTML = '数据来源: <span class="secure">Chrome API + 网络请求捕获</span>';
      httpOnlyContainer.appendChild(sourceInfo);
    }
    
    // 显示通过Chrome API获取的HTTP-only Cookie
    if (data.cookies && data.cookies.length > 0) {
      const apiSection = document.createElement('div');
      apiSection.className = 'cookie-section';
      apiSection.innerHTML = '<h3>通过Chrome API获取的HTTP-only Cookie</h3>';
      httpOnlyContainer.appendChild(apiSection);
      
      // 遍历并显示每个cookie
      data.cookies.forEach(function(cookie) {
        const cookieItem = document.createElement('div');
        cookieItem.className = 'cookie-item';
        
        const cookieName = document.createElement('div');
        cookieName.className = 'cookie-name';
        cookieName.textContent = cookie.name;
        
        const cookieValue = document.createElement('div');
        cookieValue.className = 'cookie-value';
        cookieValue.textContent = cookie.value;
        
        cookieItem.appendChild(cookieName);
        cookieItem.appendChild(cookieValue);
        
        // 添加HTTP-only标记
        if (cookie.httpOnly) {
          const httpOnlyTag = document.createElement('div');
          httpOnlyTag.className = 'cookie-details http-only';
          httpOnlyTag.textContent = 'HTTP-only';
          cookieItem.appendChild(httpOnlyTag);
        }
        
        // 添加Secure标记
        if (cookie.secure) {
          const secureTag = document.createElement('div');
          secureTag.className = 'cookie-details secure';
          secureTag.textContent = 'Secure';
          cookieItem.appendChild(secureTag);
        }
        
        // 添加登录相关标记
        if (cookie.isAuthRelated) {
          const authTag = document.createElement('div');
          authTag.className = 'cookie-details auth-related';
          authTag.textContent = '可能与登录相关';
          cookieItem.appendChild(authTag);
        }
        
        // 添加复制按钮
        const copyButton = document.createElement('button');
        copyButton.textContent = '复制';
        copyButton.style.marginTop = '5px';
        copyButton.style.fontSize = '12px';
        copyButton.style.padding = '2px 5px';
        copyButton.addEventListener('click', function() {
          const cookieText = `${cookie.name}=${cookie.value}`;
          copySingleCookie(cookieText, cookie.name);
        });
        cookieItem.appendChild(copyButton);
        
        apiSection.appendChild(cookieItem);
      });
    }
    
    // 显示通过网络请求捕获的HTTP-only Cookie
    if (data.capturedCookies && data.capturedCookies.length > 0) {
      const capturedSection = document.createElement('div');
      capturedSection.className = 'cookie-section';
      capturedSection.innerHTML = '<h3>通过网络请求捕获的HTTP-only Cookie</h3>';
      httpOnlyContainer.appendChild(capturedSection);
      
      // 遍历并显示每个捕获的cookie
      data.capturedCookies.forEach(function(cookie) {
        const cookieItem = document.createElement('div');
        cookieItem.className = 'cookie-item';
        
        const cookieName = document.createElement('div');
        cookieName.className = 'cookie-name';
        cookieName.textContent = cookie.name;
        
        const cookieValue = document.createElement('div');
        cookieValue.className = 'cookie-value';
        cookieValue.textContent = cookie.value;
        
        cookieItem.appendChild(cookieName);
        cookieItem.appendChild(cookieValue);
        
        // 添加HTTP-only标记
        if (cookie.httpOnly) {
          const httpOnlyTag = document.createElement('div');
          httpOnlyTag.className = 'cookie-details http-only';
          httpOnlyTag.textContent = 'HTTP-only';
          cookieItem.appendChild(httpOnlyTag);
        }
        
        // 添加来源标记
        const sourceTag = document.createElement('div');
        sourceTag.className = 'cookie-details';
        sourceTag.textContent = cookie.capturedFromRequest ? '来源: 请求头' : '来源: 响应头';
        cookieItem.appendChild(sourceTag);
        
        // 添加登录相关标记
        if (cookie.isAuthRelated) {
          const authTag = document.createElement('div');
          authTag.className = 'cookie-details auth-related';
          authTag.textContent = '可能与登录相关';
          cookieItem.appendChild(authTag);
        }
        
        // 添加复制按钮
        const copyButton = document.createElement('button');
        copyButton.textContent = '复制';
        copyButton.style.marginTop = '5px';
        copyButton.style.fontSize = '12px';
        copyButton.style.padding = '2px 5px';
        copyButton.addEventListener('click', function() {
          const cookieText = `${cookie.name}=${cookie.value}`;
          copySingleCookie(cookieText, cookie.name);
        });
        cookieItem.appendChild(copyButton);
        
        capturedSection.appendChild(cookieItem);
      });
    }
  }
  
  /**
   * 复制HTTP-only cookie到剪贴板
   */
  function copyHttpOnlyCookies() {
    console.log('开始复制HTTP-only Cookie...');
    if (!httpOnlyCookies || !httpOnlyCookies.cookieString) {
      console.log('没有可用的Cookie数据');
      showStatus('没有可复制的Cookie，请先获取Cookie');
      return;
    }
    
    const cookieText = httpOnlyCookies.cookieString;
    console.log('生成的Cookie字符串长度:', cookieText.length);
    
    // 尝试使用两种方式复制到剪贴板
    try {
      // 方法1: 使用navigator.clipboard API
      navigator.clipboard.writeText(cookieText).then(
        function() {
          console.log('使用clipboard API复制成功');
          showStatus('Cookie已复制到剪贴板');
        },
        function(err) {
          console.error('clipboard API复制失败:', err);
          // 如果clipboard API失败，尝试使用execCommand方法
          copyTextToClipboardFallback(cookieText);
        }
      );
    } catch (e) {
      console.error('复制过程出错:', e);
      // 出错时使用备选方法
      copyTextToClipboardFallback(cookieText);
    }
  }
  

  
  /**
   * 复制单个cookie到剪贴板
   * @param {string} cookieText - 要复制的cookie文本
   * @param {string} cookieName - cookie名称
   */
  function copySingleCookie(cookieText, cookieName) {
    console.log(`开始复制cookie: ${cookieName}...`);
    
    // 尝试使用两种方式复制到剪贴板
    try {
      // 方法1: 使用navigator.clipboard API
      navigator.clipboard.writeText(cookieText).then(
        function() {
          console.log('使用clipboard API复制成功');
          showStatus(`Cookie "${cookieName}" 已复制到剪贴板`);
        },
        function(err) {
          console.error('clipboard API复制失败:', err);
          // 如果clipboard API失败，尝试使用execCommand方法
          copyTextToClipboardFallback(cookieText, cookieName);
        }
      );
    } catch (e) {
      console.error('复制过程出错:', e);
      // 出错时使用备选方法
      copyTextToClipboardFallback(cookieText, cookieName);
    }
  }
  
  /**
   * 使用传统方法复制文本到剪贴板（备选方案）
   * @param {string} text - 要复制的文本
   * @param {string} cookieName - cookie名称（可选）
   */
  function copyTextToClipboardFallback(text, cookieName) {
    console.log('使用备选方法复制...');
    // 创建临时文本区域
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      // 执行复制命令
      success = document.execCommand('copy');
      if (success) {
        console.log('备选复制方法成功');
        if (cookieName) {
          showStatus(`Cookie "${cookieName}" 已复制到剪贴板`);
        } else {
          showStatus('Cookie已复制到剪贴板');
        }
      } else {
        console.error('execCommand复制失败');
        showError('复制失败，请手动复制');
      }
    } catch (err) {
      console.error('备选复制方法出错:', err);
      showError('复制失败: ' + err);
    }
    
    // 移除临时元素
    document.body.removeChild(textArea);
  }
  
  /**
   * 显示状态信息
   * @param {string} message - 状态信息
   */
  function showStatus(message) {
    console.log('状态:', message);
    statusElement.textContent = message;
    statusElement.classList.remove('error');
    
    // 状态信息自动消失
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
  
  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   */
  function showError(message) {
    console.error('错误:', message);
    statusElement.textContent = message;
    statusElement.classList.add('error');
  }
  
  // 监听来自background.js的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('popup收到消息:', request);
    
    if (request.action === 'httpOnlyCookiesUpdated' && request.httpOnlyCookies) {
      console.log('收到HTTP-only cookies更新:', request.httpOnlyCookies);
      // 更新HTTP-only cookies数据
      httpOnlyCookies = request.httpOnlyCookies;
      displayHttpOnlyCookies(httpOnlyCookies);
      showStatus(`成功获取 ${httpOnlyCookies.totalCount} 个HTTP-only Cookie`);
      // 发送响应确认消息已接收
      sendResponse({received: true});
    }
    
    // 返回true保持消息通道开放，以便异步响应
    return true;
  });
  
  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   */
  function showError(message) {
    statusElement.textContent = message;
    statusElement.className = 'error';
  }
  
  /**
   * 显示状态信息
   * @param {string} message - 状态信息
   */
  function showStatus(message) {
    statusElement.textContent = message;
    statusElement.className = '';
  }
});