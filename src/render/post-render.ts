/** 
 * Procesing the image data for a valid WeChat MP article for upload.
 * 
 */
import { WechatClient } from './../wechat-api/wechat-client';
function imageFileName(mime:string){
    const type = mime.split('/')[1]
    return `image-${new Date().getTime()}.${type}`
}
export function svgToPng(svgData: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            canvas.width = img.width * dpr;
            canvas.height = img.height * dpr;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to Blob'));
                }
            }, 'image/png');
        };

        img.onerror = (error) => {
            reject(error);
        };

         const encoder = new TextEncoder();
         const uint8Array = encoder.encode(svgData);
         const latin1String = String.fromCharCode.apply(null, uint8Array);
         img.src = `data:image/svg+xml;base64,${btoa(latin1String)}`;
    });
}

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
    const pngDataUrl = canvas.toDataURL('image/png');
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
        await svgToPng(svgString).then(async blob => {
            await wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
                if (res){
                    // console.log(`upload svg to wechat server: ${res.media_id}`)
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
        await wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
            if (res){
                // console.log(`upload canvas to wechat server: ${res.media_id}`)
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
        // console.log(`img src: ${img.src}`);
        
        if (img.src.includes('://mmbiz.qpic.cn/')){
            // console.log(`it is a wechat image. skipped.`);
            return;
        }
        else if (img.src.startsWith('data:image/')){
            blob = dataURLtoBlob(img.src);
        }else{
            blob = await fetch(img.src).then(res => res.blob());
        }
        
        if (blob === undefined){
            console.log(`not blob, return`);
            return
            
        }else{

            await wechatClient.uploadImage(blob, imageFileName(blob.type)).then(res => {
                if (res){
                    img.src = res.url
                }else{
                    console.log(`upload image failed.`);
                    
                }
            })
        }
    })
    await Promise.all(uploadPromises)
}