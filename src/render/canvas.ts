export function saveSvgAsPng(svgString: string, fileName: string): void {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('无法获取 2D 渲染上下文');
    }
    const img = new Image();
  
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      }, 'image/png');
    };
  
    img.src = url;
  }

  function saveCanvasAsPng(canvas: HTMLCanvasElement, fileName: string): void {
    // 使用canvas.toBlob()方法将canvas内容转换为Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas could not be converted to Blob');
        return;
      }
      
      // 创建一个临时的URL指向Blob
      const url = URL.createObjectURL(blob);
  
      // 创建一个<a>元素用于下载
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
  
      // 添加到文档中并触发点击事件
      document.body.appendChild(link);
      link.click();
  
      // 清理：移除<a>元素并释放Blob URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
  
//   // 使用示例
//   // 假设你有一个id为'my-canvas'的canvas元素
//   const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
//   if (canvas) {
//     saveCanvasAsPng(canvas, 'canvas-output.png');
//   }
  