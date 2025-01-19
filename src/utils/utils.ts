import { requestUrl } from "obsidian";

export function areObjectsEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        console.log(`object not same type`);
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !areObjectsEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export function fetchImageBlob(url: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        if (!url) {
            console.error(`Invalid URL: ${url}`);
            return;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) {


            try {
                const response = await requestUrl(url);
                if (!response.arrayBuffer) {
                    console.error(`Failed to fetch image from ${url}`);
                    return;
                }
                const blob = new Blob([response.arrayBuffer]);
                resolve(blob);
            } catch (error) {
                console.error(`Error fetching image from ${url}:`, error);
                return;
            }
        } else {
            const blob = await fetch(url).then(response => response.blob());
            resolve(blob);

        }

    });
}

export function replaceDivWithSection(root: HTMLElement){
    let html = root.outerHTML.replaceAll(/<div /g, '<section ').replaceAll(/<\/div>/g, '</section>');
    return html;

}
