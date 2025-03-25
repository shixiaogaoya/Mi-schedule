/**
 * @Author: 22智科-MingOvO
 * @Date: 2024-03-13 20:30:28
 * @LastEditTime: 2025-03-19 00:24:59
 * @LastEditors: 22智科-MingOvO
 * @QQ：2945594404
 * @参考：竹林里有冰
 */
async function scheduleHtmlProvider(iframeContent = "", frameContent = "", dom = document) {
  await loadTool('AIScheduleTools')
  
  // 添加base64编码函数
  function base64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
  }

  // 添加request函数实现
  async function request(method, encoding, url) {
    // 获取完整的URL路径
    const baseUrl = "https://webvpn.fynu.edu.cn/http-8080/77726476706e69737468656265737421fae00f9a3e3e7d1e7b0c9ce29b5b/fysdjw";
    const fullUrl = url.startsWith("http") ? url : baseUrl + url;
    
    let response = await fetch(fullUrl, {
      method: method,
      credentials: 'include',
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "upgrade-insecure-requests": "1"
      }
    });
    
    if (encoding === 'gbk') {
      let buffer = await response.arrayBuffer();
      let decoder = new TextDecoder('gbk');
      return decoder.decode(buffer);
    } else {
      return await response.text();
    }
  }

  try {
    // 获取学年学期信息
    const year = await AISchedulePrompt({
      titleText: '学年',
      tipText: '请输入本学年开始的年份',
      defaultText: '2024',
      validator: value => {
        try {
          const v = parseInt(value)
          if (v < 2000 || v > 2100) {
            return '请输入正确的学年'
          }
          return false
        } catch (error) {
          return '请输入正确的学年'
        }
      }
    })

    const term = await AISchedulePrompt({
      titleText: '学期',
      tipText: '请输入本学期的学期(0表示第一学期,1表示第二学期)',
      defaultText: '0',
      validator: value => {
        if (value === '0' || value === '1') {
          return false
        }
        return '请输入正确的学期'
      }
    })

    // 使用固定的学号
    const studentId = "202100008914";

    // 构建参数并进行Base64编码
    const params = `xn=${year}&xq=${term}&xh=${studentId}`;
    const encodedParams = base64Encode(params);
    
    // 使用正确的URL路径获取课表数据
    let courseTable = await request(
      "get", 
      'gbk', 
      "/student/wsxk.xskcb10319.jsp?params=" + encodedParams
    );
    
    // 解析HTML
    let kbdom = new DOMParser().parseFromString(courseTable, "text/html");
    let id = "二维表";
    
    // 获取所有表格
    let ht = "";
    let tables = kbdom.getElementsByTagName("table");
    for (let i = 0; i < tables.length; i++) {
      ht += tables[i].outerHTML;
    }
    
    // 返回JSON格式的数据
    return JSON.stringify({ htm: ht, bz: id || "二维表" });
    
  } catch (error) {
    console.error(error);
    await AIScheduleAlert('请确认您已登录教务系统');
    return 'do not continue';
  }
}