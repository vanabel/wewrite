import { WechatClient } from './../wechat-api/wechat-client';
/* 在obsidian中会出现各种新的图形的格式，或者复杂的SVG，都会导致内容过于大：

- 复杂的svg，内嵌了图片之类的。
- canvas，比如chats
- 大型的文本格式的图片src
- mermaid的svg出现一些线条和箭头的格式有问题。

这些类型的文件都需要处理为上传的图片，简化在现在的页面结构 */

function imageFileName(mime:string){
    const type = mime.split('/')[1]
    return `image-${new Date().getTime()}.${type}`
}
export function svgToPng(svgData: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        // 创建一个Image对象
        const img = new Image();

        // 当Image加载完成后
        img.onload = () => {
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;

            // 设置canvas的分辨率
            canvas.width = img.width * dpr;
            canvas.height = img.height * dpr;


            // 获取2D渲染上下文
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // 将Image绘制到canvas上
            ctx.drawImage(img, 0, 0);

            // 将canvas内容转换为Blob对象
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to Blob'));
                }
            }, 'image/png');
        };

        // 当Image加载失败
        img.onerror = (error) => {
            reject(error);
        };

         // 将字符串转换为 Latin1 编码
         const encoder = new TextEncoder();
         const uint8Array = encoder.encode(svgData);
         const latin1String = String.fromCharCode.apply(null, uint8Array);
 
         // 设置Image的源为SVG数据
         img.src = `data:image/svg+xml;base64,${btoa(latin1String)}`;
    });
}

// 如果需要将data URL转换为Blob对象以便上传
function dataURLtoBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;

    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}
export function getCanvasBlob(canvas: HTMLCanvasElement) {
    // 获取canvas内容的PNG图片数据URL
    const pngDataUrl = canvas.toDataURL('image/png');
    // 使用转换函数
    const pngBlob = dataURLtoBlob(pngDataUrl);
    return pngBlob;
}

export async function uploadSVGs(root: HTMLElement, wechatClient: WechatClient){
    const svgs: SVGSVGElement[] = []
    root.querySelectorAll('svg').forEach(svg => {
        svgs.push(svg)
    })

    const uploadPromises = svgs.map(async (svg) => {
        const svgString = svg.outerHTML;
        if (svgString.length < 10000) {
            console.log(`svg size:${svgString.length} < 100000; skipped.`)
            return
        }
        svgToPng(svgString).then(blob => {
            wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
                if (res){
                    console.log(`upload svg to wechat server: ${res.media_id}`)
                    svg.outerHTML = `<img src="${res.url}" />`
                }else{
                    console.log(`upload svg failed.`);
                    
                }
            })
        })
    })
    await Promise.all(uploadPromises)
}
export async function uploadCanvas(root:HTMLElement, wechatClient:WechatClient):Promise<void>{
    const canvases: HTMLCanvasElement[] = []
    
    root.querySelectorAll('canvas').forEach (canvas => {
        canvases.push(canvas)
    })
    
    const uploadPromises = canvases.map(async (canvas) => {
        const blob = getCanvasBlob(canvas);
        wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
            if (res){
                console.log(`upload canvas to wechat server: ${res.media_id}`)
                canvas.outerHTML = `<img src="${res.url}" />`
            }else{
                console.log(`upload canvas failed.`);
                
            }
        })
    })
    await Promise.all(uploadPromises)
}

export async function uploadURLImage(root:HTMLElement, wechatClient:WechatClient):Promise<void>{
    const images: HTMLImageElement[] = []
    
    root.querySelectorAll('img').forEach (img => {
        images.push(img)
    })
    
    const uploadPromises = images.map(async (img) => {
        let blob:Blob|undefined 
        console.log(`img src: ${img.src}`);
        
        if (img.src.startsWith('https://mmbiz.qpic.cn/')){
            console.log(`it is a wechat image. skipped.`);
            return;
        }
        else if (img.src.startsWith('data:image/')){
            blob = dataURLtoBlob(img.src);
        }else{
            console.log(`try to fetch other image url:`, img.src);
            blob = await fetch(img.src).then(res => res.blob());
        }
        
        if (blob === undefined){
            console.log(`not blob, return`);
            return
            
        }else{

            wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
                if (res){
                    console.log(`upload image to wechat server: `,res)
                    img.src = res.url
                }else{
                    console.log(`upload image failed.`);
                    
                }
            })
        }
    })
    await Promise.all(uploadPromises)
}