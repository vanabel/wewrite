// 定义滚动函数
export function scrollToBottomOfElement(element:HTMLElement, duration:number = 2000) {
    // 获取当前滚动位置
    const start = element.scrollTop;
    // 获取目标位置，即滚动区域底部
    const end = element.scrollHeight - element.clientHeight;
    // 计算需要滚动的距离
    const distance = end - start;
  
    // 如果已经处于滚动区域底部，则不执行滚动
    if (distance === 0) return;
  
    // 计算滚动时间，默认为500毫秒
    let timeStart = performance.now();
    duration = duration || 500;
  
    // 定义动画函数
    function animateScroll(time:number) {
      // 计算已经过去的时间
      let timeElapsed = time - timeStart;
      // 计算当前滚动位置
      let next = easeInOutQuad(timeElapsed, start, distance, duration);
      
      // 设置滚动位置
      element.scrollTop = next;
  
      // 如果动画时间未结束，继续执行动画
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        // 动画结束，确保滚动到精确位置
        element.scrollTop = end;
      }
    }
  
    // 启动动画
    requestAnimationFrame(animateScroll);
  }
  
  // 自定义的easeInOutQuad缓动函数
  function easeInOutQuad(t:number, b:number, c:number, d:number) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
  
  // 假设你有一个滚动区域的元素，它的id是"scrollArea"
  const scrollArea = document.getElementById('scrollArea');
  
  // 调用滚动函数，传入动画持续时间（毫秒）
//   scrollToBottomOfElement(scrollArea, 1000); // 滚动到底部，持续时间为1000毫秒
  