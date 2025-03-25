function getWeeks(weekStr) {
  let weeks = [];
  
  // 处理单双周的情况
  if (weekStr.includes('单')) {
    let range = weekStr.replace(/\s*单.*/, '').split('-');
    let start = parseInt(range[0]);
    let end = parseInt(range[1]);
    for (let i = start; i <= end; i++) {
      if (i % 2 === 1) { // 单周
        weeks.push(i);
      }
    }
  } else if (weekStr.includes('双')) {
    let range = weekStr.replace(/\s*双.*/, '').split('-');
    let start = parseInt(range[0]);
    let end = parseInt(range[1]);
    for (let i = start; i <= end; i++) {
      if (i % 2 === 0) { // 双周
        weeks.push(i);
      }
    }
  } else if (weekStr.includes('-')) {
    let range = weekStr.split('-');
    let start = parseInt(range[0]);
    let end = parseInt(range[1]);
    for (let i = start; i <= end; i++) {
      weeks.push(i);
    }
  } else {
    weeks.push(parseInt(weekStr));
  }
  
  return weeks;
}

function getSection(sectionStr) {
  let sections = [];
  
  if (sectionStr.includes('-')) {
    let range = sectionStr.split('-');
    let start = parseInt(range[0]);
    let end = parseInt(range[1]);
    for (let i = start; i <= end; i++) {
      sections.push(i);
    }
  } else {
    sections.push(parseInt(sectionStr));
  }
  
  return sections;
}

function scheduleHtmlParser(html) {
  try {
    // 解析JSON格式的数据
    let providerResult = JSON.parse(html);
    let htmlContent = providerResult.htm;
    
    // 使用cheerio加载HTML内容
    let $ = cheerio.load(htmlContent, { decodeEntities: false });
    let result = [];
    
    // 创建一个映射表，将HTML中的列索引映射到正确的星期几
    // 根据HTML结构，第一列是星期一，第二列是星期二，以此类推
    const columnToDay = {
      0: 1, // 第一列对应星期一
      1: 2, // 第二列对应星期二
      2: 3, // 第三列对应星期三
      3: 4, // 第四列对应星期四
      4: 5, // 第五列对应星期五
      5: 6, // 第六列对应星期六
      6: 7  // 第七列对应星期日
    };
    
    // 中文数字到阿拉伯数字的映射
    let sectionMap = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10};
    
    // 遍历每一行
    $('tr').each(function(rowIndex, row) {
      // 跳过表头行
      if ($(row).hasClass('H')) return;
      
      // 获取当前行的节次信息
      let sectionText = '';
      $(row).find('td.td1 b').each(function() {
        let text = $(this).text().trim();
        if (text.match(/[一二三四五六七八九十]/)) {
          sectionText = text;
        }
      });
      
      // 将中文数字转换为阿拉伯数字
      let sectionNum = sectionMap[sectionText];
      
      if (!sectionNum) return;
      
      // 遍历每个单元格
      let cells = $(row).find('td.td');
      cells.each(function(cellIndex, cell) {
        // 获取星期几
        let day = columnToDay[cellIndex];
        if (!day) return;
        
        // 查找所有课程div（非空课）
        $(cell).find('div:not(.div_nokb)').each(function() {
          let courseHtml = $(this).html();
          if (!courseHtml || courseHtml.trim() === '') return;
          
          // 解析课程信息
          let course = {
            name: '',
            teacher: '',
            position: '',
            day: day,
            weeks: [],
            sections: []
          };
          
          // 解析课程名称
          let nameMatch = courseHtml.match(/<font[^>]*>(.*?)<\/font>/);
          if (nameMatch) {
            course.name = nameMatch[1].trim();
          }
          
          // 分割HTML内容获取其他信息
          let parts = courseHtml.split('<br>');
          
          // 解析教师名称
          if (parts.length > 1) {
            course.teacher = parts[1].trim();
          }
          
          // 解析周次和节次
          if (parts.length > 2) {
            let weekSectionText = parts[2].trim();
            
            // 解析周次
            let weekMatch = weekSectionText.match(/(\d+-\d+|\d+)(\s*单|\s*双)?/);
            if (weekMatch) {
              course.weeks = getWeeks(weekMatch[0]);
            }
            
            // 解析节次
            let sectionMatch = weekSectionText.match(/\[(\d+-\d+|\d+)\]/);
            if (sectionMatch) {
              course.sections = getSection(sectionMatch[1]);
            } else {
              // 如果没有明确的节次信息，使用行的节次
              course.sections = [sectionNum];
            }
          }
          
          // 解析教室位置
          if (parts.length > 3) {
            course.position = parts[3].trim();
          }
          
          // 只有当课程信息完整时才添加到结果中
          if (course.name && course.sections.length > 0 && course.weeks.length > 0) {
            result.push(course);
          }
        });
      });
    });
    
    // 如果没有解析到课程，添加一个错误提示
    if (result.length === 0) {
      result.push({
        name: "未能解析到课程信息",
        teacher: "22智科MingOvO",
        position: "请联系开发者",
        day: 1,
        weeks: [1],
        sections: [1, 2]
      });
    }
    
    // 调试信息
    console.log("解析到的课程数量:", result.length);
    
    return result;
  } catch (e) {
    console.error(e);
    return [{
      name: "解析出错，请联系开发者",
      teacher: "22智科MingOvO",
      position: e.message.slice(0, 50),
      day: 1,
      weeks: [1],
      sections: [1, 2]
    }];
  }
}