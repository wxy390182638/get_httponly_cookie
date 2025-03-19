// 后台服务工作线程
// 负责处理来自弹出窗口的消息，并使用Chrome cookies API和webRequest API获取HTTP-only Cookie

// 存储HTTP-only cookie信息
let httpOnlyCookies = null;

// 存储从网络请求中捕获的cookie
let capturedCookies = new Map();

// 登录相关的cookie关键词
const authKeywords = ['auth', 'login', 'token', 'session', 'sid', 'user', 'account', 'member', 'jwt', 'access', 'refresh', 'id', 'credential'];

// 监听来自扩展其他部分的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('后台脚本收到消息:', request);
  
  if (request.action === 'getHttpOnlyCookies') {
    console.log('收到获取HTTP-only cookies请求');
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0) {
        sendResponse({success: false, error: '无法获取当前标签页信息'});
        return;
      }
      
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      const domain = url.hostname;
      
      // 使用chrome.cookies API获取所有cookie，包括HTTP-only cookie
      chrome.cookies.getAll({domain: domain}, function(cookies) {
        if (chrome.runtime.lastError) {
          console.error('获取cookie失败:', chrome.runtime.lastError);
          sendResponse({success: false, error: '获取cookie失败: ' + chrome.runtime.lastError.message});
          return;
        }
        
        console.log(`成功获取 ${cookies.length} 个cookie`);
        
        // 过滤出HTTP-only cookie并标记登录相关cookie
        const httpOnlyCookiesArray = cookies.filter(cookie => cookie.httpOnly).map(cookie => {
          // 检查cookie名称是否包含登录相关关键词
          const lowerName = cookie.name.toLowerCase();
          const isAuthRelated = authKeywords.some(keyword => lowerName.includes(keyword));
          return {...cookie, isAuthRelated};
        });
        
        // 检查是否有通过网络请求捕获的Cookie
        let capturedCookiesArray = [];
        const capturedForUrl = capturedCookies.get(currentTab.url);
        if (capturedForUrl && capturedForUrl.cookies && capturedForUrl.cookies.length > 0) {
          capturedCookiesArray = capturedForUrl.cookies.filter(cookie => cookie.httpOnly);
          console.log(`从网络请求中捕获了 ${capturedCookiesArray.length} 个HTTP-only cookie`);
        }
        console.log(`其中 ${httpOnlyCookiesArray.length} 个是HTTP-only cookie`);
        
        // 构建cookie字符串，包括API获取的和网络请求捕获的
        const allCookies = [...httpOnlyCookiesArray];
        let capturedFromRequests = false;
        
        // 如果有捕获的Cookie，合并到结果中
        if (capturedCookiesArray.length > 0) {
          capturedFromRequests = true;
          
          // 避免重复添加相同名称的Cookie
          const existingNames = new Set(allCookies.map(c => c.name));
          capturedCookiesArray.forEach(cookie => {
            if (!existingNames.has(cookie.name)) {
              allCookies.push(cookie);
              existingNames.add(cookie.name);
            }
          });
        }
        
        // 构建cookie字符串
        const cookieString = allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        
        // 存储cookie信息
        httpOnlyCookies = {
          url: currentTab.url,
          cookieString: cookieString,
          cookies: httpOnlyCookiesArray,
          capturedCookies: capturedCookiesArray,
          capturedFromRequests: capturedFromRequests,
          timestamp: Date.now(),
          totalCount: allCookies.length
        };
        
        // 发送响应
        sendResponse({success: true, httpOnlyCookies: httpOnlyCookies});
        
        // 通知popup更新
        chrome.runtime.sendMessage({
          action: 'httpOnlyCookiesUpdated',
          httpOnlyCookies: httpOnlyCookies
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.log('发送消息失败:', chrome.runtime.lastError.message);
          } else if (response) {
            console.log('popup已接收消息:', response);
          }
        });
      });
      
      return true; // 保持消息通道开放，以便异步响应
    });
    
    return true; // 保持消息通道开放，以便异步响应
  }
});

// 使用webRequest API监听网络请求，捕获Cookie
chrome.webRequest.onSendHeaders.addListener(
  function(details) {
    // 处理所有类型的请求，不仅限于主文档和XHR
    console.log(`捕获请求: ${details.url}, 类型: ${details.type}`);
    
    // 获取请求头中的Cookie
    const headers = details.requestHeaders;
    if (!headers) {
      console.log('请求没有头信息');
      return;
    }
    
    // 查找Cookie头
    const cookieHeader = headers.find(header => header.name.toLowerCase() === 'cookie');
    if (!cookieHeader || !cookieHeader.value) {
      console.log('请求中没有Cookie头');
      return;
    }
    
    console.log('捕获到请求Cookie:', cookieHeader.value);
    
    // 解析Cookie字符串
    const cookies = parseCookieString(cookieHeader.value);
    if (cookies.length === 0) {
      console.log('解析Cookie字符串失败');
      return;
    }
    
    // 添加调试日志
    console.log('成功解析请求Cookie:', cookies.map(c => c.name).join(', '));
    
    // 存储捕获的Cookie
    capturedCookies.set(details.url, {
      url: details.url,
      cookies: cookies,
      timestamp: Date.now()
    });
    
    console.log(`已捕获 ${cookies.length} 个Cookie从请求: ${details.url}`);
    
    // 如果当前有活动的标签页，并且URL匹配，则更新httpOnlyCookies并通知popup
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0 && tabs[0].url === details.url && httpOnlyCookies) {
        // 更新httpOnlyCookies中的capturedCookies
        const httpOnlyCookiesArray = httpOnlyCookies.cookies || [];
        const capturedCookiesArray = cookies.filter(cookie => cookie.httpOnly);
        
        if (capturedCookiesArray.length > 0) {
          // 避免重复添加相同名称的Cookie
          const existingNames = new Set(httpOnlyCookiesArray.map(c => c.name));
          capturedCookiesArray.forEach(cookie => {
            if (!existingNames.has(cookie.name)) {
              httpOnlyCookiesArray.push(cookie);
              existingNames.add(cookie.name);
            }
          });
          
          // 更新httpOnlyCookies
          httpOnlyCookies.capturedCookies = capturedCookiesArray;
          httpOnlyCookies.capturedFromRequests = true;
          httpOnlyCookies.timestamp = Date.now();
          httpOnlyCookies.totalCount = httpOnlyCookiesArray.length + capturedCookiesArray.length;
          
          // 更新cookieString
          const allCookies = [...httpOnlyCookiesArray, ...capturedCookiesArray];
          httpOnlyCookies.cookieString = allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
          
          // 通知popup更新
          chrome.runtime.sendMessage({
            action: 'httpOnlyCookiesUpdated',
            httpOnlyCookies: httpOnlyCookies
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('发送消息失败:', chrome.runtime.lastError.message);
            } else if (response) {
              console.log('popup已接收消息:', response);
            }
          });
        }
      }
    });
  },
  {urls: ["<all_urls>"]},
  ["requestHeaders", "extraHeaders"]
);

// 监听响应头，捕获Set-Cookie
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    // 处理所有类型的请求，不仅限于主文档和XHR
    console.log(`捕获响应: ${details.url}, 类型: ${details.type}`);
    
    // 获取响应头
    const headers = details.responseHeaders;
    if (!headers) {
      console.log('响应没有头信息');
      return;
    }
    
    // 查找所有Set-Cookie头
    const setCookieHeaders = headers.filter(header => header.name.toLowerCase() === 'set-cookie');
    if (setCookieHeaders.length === 0) {
      console.log('响应中没有Set-Cookie头');
      return;
    }
    
    console.log(`捕获到 ${setCookieHeaders.length} 个Set-Cookie响应头，URL: ${details.url}`);
    console.log('请求类型:', details.type);
    
    // 解析Set-Cookie头
    const cookies = [];
    setCookieHeaders.forEach(header => {
      console.log('解析Set-Cookie头:', header.value);
      const parsedCookie = parseSetCookieHeader(header.value);
      if (parsedCookie) {
        cookies.push(parsedCookie);
        console.log('成功解析Cookie:', parsedCookie.name, parsedCookie.httpOnly ? '(HTTP-only)' : '');
      } else {
        console.log('解析Set-Cookie头失败');
      }
    });
    
    if (cookies.length === 0) {
      console.log('没有成功解析任何Cookie');
      return;
    }
    
    // 合并或更新捕获的Cookie
    let captured = capturedCookies.get(details.url) || {
      url: details.url,
      cookies: [],
      timestamp: Date.now()
    };
    
    // 合并Cookie列表，避免重复
    const existingNames = new Set(captured.cookies.map(c => c.name));
    cookies.forEach(cookie => {
      if (!existingNames.has(cookie.name)) {
        captured.cookies.push(cookie);
        existingNames.add(cookie.name);
      }
    });
    
    captured.timestamp = Date.now();
    capturedCookies.set(details.url, captured);
    
    console.log(`已捕获 ${cookies.length} 个Cookie从响应: ${details.url}`);
    
    // 如果当前有活动的标签页，并且URL匹配，则更新httpOnlyCookies并通知popup
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0 && tabs[0].url === details.url && httpOnlyCookies) {
        // 更新httpOnlyCookies中的capturedCookies
        const httpOnlyCookiesArray = httpOnlyCookies.cookies || [];
        const capturedCookiesArray = cookies.filter(cookie => cookie.httpOnly);
        
        if (capturedCookiesArray.length > 0) {
          // 避免重复添加相同名称的Cookie
          const existingNames = new Set(httpOnlyCookiesArray.map(c => c.name));
          capturedCookiesArray.forEach(cookie => {
            if (!existingNames.has(cookie.name)) {
              httpOnlyCookiesArray.push(cookie);
              existingNames.add(cookie.name);
            }
          });
          
          // 更新httpOnlyCookies
          httpOnlyCookies.capturedCookies = capturedCookiesArray;
          httpOnlyCookies.capturedFromRequests = true;
          httpOnlyCookies.timestamp = Date.now();
          httpOnlyCookies.totalCount = httpOnlyCookiesArray.length + capturedCookiesArray.length;
          
          // 更新cookieString
          const allCookies = [...httpOnlyCookiesArray, ...capturedCookiesArray];
          httpOnlyCookies.cookieString = allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
          
          // 通知popup更新
          chrome.runtime.sendMessage({
            action: 'httpOnlyCookiesUpdated',
            httpOnlyCookies: httpOnlyCookies
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('发送消息失败:', chrome.runtime.lastError.message);
            } else if (response) {
              console.log('popup已接收消息:', response);
            }
          });
        }
      }
    });
  },
  {urls: ["<all_urls>"]},
  ["responseHeaders", "extraHeaders"]
);

/**
 * 解析Cookie字符串
 * @param {string} cookieStr - Cookie字符串
 * @returns {Array} - Cookie对象数组
 */
function parseCookieString(cookieStr) {
  const cookies = [];
  const pairs = cookieStr.split(';');
  
  pairs.forEach(pair => {
    const [name, value] = pair.trim().split('=', 2);
    if (name && value !== undefined) {
      const lowerName = name.trim().toLowerCase();
      const isAuthRelated = authKeywords.some(keyword => lowerName.includes(keyword));
      
      cookies.push({
        name: name.trim(),
        value: value.trim(),
        capturedFromRequest: true,
        httpOnly: true,  // 从请求中捕获的Cookie默认设置为HTTP-only，因为无法确定其真实属性
        isAuthRelated: isAuthRelated  // 标记是否可能与登录状态相关
      });
    }
  });
  
  return cookies;
}

/**
 * 解析Set-Cookie头
 * @param {string} setCookieStr - Set-Cookie头值
 * @returns {Object|null} - Cookie对象
 */
function parseSetCookieHeader(setCookieStr) {
  try {
    const parts = setCookieStr.split(';');
    const firstPart = parts[0].trim();
    const equalsIndex = firstPart.indexOf('=');
    
    // 处理没有等号的情况
    if (equalsIndex === -1) {
      console.log('Set-Cookie格式错误，没有等号:', setCookieStr);
      return null;
    }
    
    const name = firstPart.substring(0, equalsIndex).trim();
    const value = firstPart.substring(equalsIndex + 1).trim();
    
    if (!name) {
      console.log('Set-Cookie名称为空:', setCookieStr);
      return null;
    }
    
    const lowerName = name.toLowerCase();
    const isAuthRelated = authKeywords.some(keyword => lowerName.includes(keyword));
    
    const cookie = {
      name: name,
      value: value,
      capturedFromResponse: true,
      capturedFromRequest: false,  // 明确标记不是从请求中捕获的
      httpOnly: false,  // 默认为false
      secure: false,    // 默认为false
      isAuthRelated: isAuthRelated  // 标记是否可能与登录状态相关
    };
    
    // 解析Cookie属性
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim().toLowerCase();
      if (part === 'httponly') {
        cookie.httpOnly = true;
        console.log(`Cookie ${name} 是HTTP-only`);
      } else if (part === 'secure') {
        cookie.secure = true;
      }
    }
    
    return cookie;
  } catch (error) {
    console.error('解析Set-Cookie时出错:', error, setCookieStr);
    return null;
  }
}

// 安装或更新扩展时执行的操作
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Cookie获取器扩展已安装或更新:', details.reason);
  
  if (details.reason === 'install') {
    chrome.storage.local.set({installTime: Date.now()}, function() {
      console.log('初始设置已保存');
    });
  }
});