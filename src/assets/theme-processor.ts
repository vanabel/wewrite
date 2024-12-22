import { sanitizeHTMLToDom } from 'obsidian';
import * as postcss from 'postcss';
import WeWritePlugin from 'src/main';

export class ThemeProcessor {
    private _theme: string;
    private _themeMap: Map<string, string>;
    private _plugin: WeWritePlugin;
    private static _instance: ThemeProcessor;

    constructor(plugin: WeWritePlugin) {
        this._themeMap = new Map<string, string>();
        this._plugin = plugin;

    }
    static getInstance(plugin: WeWritePlugin) {
        if (!ThemeProcessor._instance) {
            ThemeProcessor._instance = new ThemeProcessor(plugin);
        }
        return ThemeProcessor._instance;
    }

    private getStyleSheetOfTitle(title: string) {
        // <style tilte="title" ....</style>
        for (var i = 0; i < document.styleSheets.length; i++) {
            var sheet = document.styleSheets[i];
            if (sheet.title === title) {
                return sheet;
            }
        }
    }
    private applyStyleDeclarationsToElementStyleProperty(element: HTMLElement, styles: CSSStyleDeclaration, computedStyle: CSSStyleDeclaration) {

        for (let i = 0; i < styles.length; i++) {
            const propertyName = styles[i];
            // ignore computed： width, margin 
            let propertyValue = computedStyle.getPropertyValue(propertyName);
            if (propertyName == 'width' && styles.getPropertyValue(propertyName) == 'fit-content') {
                propertyValue = 'fit-content';
            }
            if (propertyName.indexOf('margin') >= 0 && styles.getPropertyValue(propertyName).indexOf('auto') >= 0) {
                propertyValue = styles.getPropertyValue(propertyName);
            }
            // set property to element
            element.style.setProperty(propertyName, propertyValue);
        }
    }
    private applyStyleSheet(element: HTMLElement, sheet: CSSStyleSheet) {
        try {
            for (let i = 0; i < sheet.cssRules.length; i++) {
                // each custom style rule of valid CSSStyleRule that matches the element
                const rule = sheet.cssRules[i];
                if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
                    // get computed style of the element
                    const computedStyle = getComputedStyle(element);
                    this.applyStyleDeclarationsToElementStyleProperty(element, rule.style, computedStyle);
                }
            }
        } catch (e) {
            console.warn("Unable to access stylesheet: " + sheet.href, e);
        }
    }
    private traverse(root: HTMLElement, sheet: CSSStyleSheet) {
        let element = root.firstElementChild;
        while (element) {
            if (element.tagName === 'svg') {
                // will not go further inside svg element
            }
            else {
                // 1. iterating to children of next level
                this.traverse(element as HTMLElement, sheet);
            }
            // 2. iterating to next sibling
            element = element.nextElementSibling;
        }
        // 3. apply style to current element
        this.applyStyleSheet(root, sheet);
    }
    public async processNamedStyle(content: HTMLElement, styleTitle: string) {
        //get the custom style in draft render div 
        const style = this.getStyleSheetOfTitle(styleTitle);
        if (style) {
            this.traverse(content, style);
        }
    }
    static parseCSS(css: string) {

        return postcss.parse(css);
    }
    static ruleToStyle(rule: postcss.Rule) {
        let style = '';
        rule.walkDecls(decl => {
            style += decl.prop + ':' + decl.value + ';';
        })

        return style;
    }
    private applyStyle(root: HTMLElement, cssRoot: postcss.Root) {

        //1. apply to current element, each rule in cssRoot that matches the element
        const cssText = root.style.cssText;
        cssRoot.walkRules(rule => {
            if (root.matches(rule.selector)) {
                rule.walkDecls(decl => {
                    const setted = cssText.includes(decl.prop);
                    if (!setted || decl.important) {
                        root.style.setProperty(decl.prop, decl.value);
                    }
                })
            }
        });

        // for iteration

        if (root.tagName === 'svg') {
            // not go inside svg
            return;
        }

        // other elements: children and siblings.
        let element = root.firstElementChild;
        while (element) {
            // 2. firt child
            this.applyStyle(element as HTMLElement, cssRoot);

            // 3. next sibling
            element = element.nextElementSibling;
        }
    }

    public applyCSS(html: string, css: string) {
        // build a com doc
        const doc = sanitizeHTMLToDom(html);
        const root = doc.firstChild as HTMLElement;

        // parse css text to cssRoot
        const cssRoot = postcss.parse(css);

        // iterately apply cssRoot to root
        this.applyStyle(root, cssRoot);
        return root.outerHTML;
    }
}


// function getComputedStyleWithoutDefaults(element: HTMLElement): CSSStyleDeclaration {
//     const computedStyle = window.getComputedStyle(element);
//     const defaultElement = document.createElement(element.tagName);
//     document.body.appendChild(defaultElement);
//     const defaultStyle = window.getComputedStyle(defaultElement);
//     document.body.removeChild(defaultElement);

//     const nonDefaultStyles: CSSStyleDeclaration = {} as CSSStyleDeclaration;
//     for (let i = 0; i < computedStyle.length; i++) {
//         const property = computedStyle[i];
//         if (computedStyle.getPropertyValue(property) !== defaultStyle.getPropertyValue(property)) {
//             nonDefaultStyles[property] = computedStyle.getPropertyValue(property);
//         }
//     }
//     return nonDefaultStyles;
// }

// function applyUniqueStyles(element: HTMLElement, parentStyles: CSSStyleDeclaration = {}) {
//     const nonDefaultStyles = getComputedStyleWithoutDefaults(element);
//     const uniqueStyles: CSSStyleDeclaration = {} as CSSStyleDeclaration;

//     for (let i = 0; i < nonDefaultStyles.length; i++) {
//         const property = nonDefaultStyles[i];
//         if (nonDefaultStyles.getPropertyValue(property) !== parentStyles.getPropertyValue(property)) {
//             uniqueStyles[property] = nonDefaultStyles.getPropertyValue(property);
//         }
//     }

//     for (let i = 0; i < uniqueStyles.length; i++) {
//         const property = uniqueStyles[i];
//         element.style.setProperty(property, uniqueStyles.getPropertyValue(property));
//     }

//     Array.from(element.children).forEach(child => applyUniqueStyles(child as HTMLElement, nonDefaultStyles));
// }

// export function extractAndApplyStyles() {
//     const allElements = document.querySelectorAll('*');
//     allElements.forEach(element => applyUniqueStyles(element as HTMLElement));
// }

// extractAndApplyStyles();


export function extractUniqueStyles(element: HTMLElement) {
    // 获取当前元素的计算样式
    const style = window.getComputedStyle(element);
    // 获取父元素的样式，以便比较
    const parentStyle = element.parentElement ? window.getComputedStyle(element.parentElement) : null;

    // 遍历所有样式属性
    for (let i = 0; i < style.length; i++) {
        const property = style[i];
        const value = style.getPropertyValue(property);
        const parentValue = parentStyle ? parentStyle.getPropertyValue(property) : null;

        // // 检查是否是默认值或者继承自父元素
        // if (value !== parentValue && value !== '') {
        //    // 使用 setProperty 方法来设置样式属性
        //    element.style.setProperty(property, value);
        // }
        // 检查是否是默认值或者继承自父元素
        if (value !== parentValue && value !== '') {
            // 对于SVG元素，保留必要的样式属性
            if (element instanceof SVGElement) {
                const isImportantStyle = property === 'stroke' || property === 'fill' || property === 'stroke-width' || property === 'marker-start' || property === 'marker-end';
                if (isImportantStyle || !parentStyle || parentStyle.getPropertyValue(property) !== value) {
                    element.style.setProperty(property, value);
                }
            } else {
                element.style.setProperty(property, value);
            }
        }
    }

    // 递归处理子元素
    Array.from(element.children).forEach(child => extractUniqueStyles(child as HTMLElement));
}

// 从根元素开始提取样式
// extractUniqueStyles(document.body);



export function processStyle(element: HTMLElement) {
    // 获取当前元素的计算样式
    const style = window.getComputedStyle(element);
    // 获取父元素的样式，以便比较
    const parentStyle = element.parentElement ? window.getComputedStyle(element.parentElement) : null;

    // 遍历所有样式属性
    for (let i = 0; i < style.length; i++) {
        
        const property = style[i];
        const value = style.getPropertyValue(property);
        element.style.setProperty(property, value);
        // const parentValue = parentStyle ? parentStyle.getPropertyValue(property) : null;

        // if (value !== parentValue && value) {
        //     element.style.setProperty(property, value);
        //     // // 对于SVG元素，保留必要的样式属性
        //     // if (element instanceof SVGElement) {
        //     //     const isImportantStyle = property === 'stroke' || property === 'fill' || property === 'stroke-width' || property === 'marker-start' || property === 'marker-end';
        //     //     if (isImportantStyle || !parentStyle || parentStyle.getPropertyValue(property) !== value) {
        //     //         element.style.setProperty(property, value);
        //     //     }
        //     // } else {
        //     //     element.style.setProperty(property, value);
        //     // }
        // }
    }

    // 递归处理子元素
    Array.from(element.children).forEach(child => processStyle(child as HTMLElement));
}

export function setFullStyle(element: HTMLElement) {
    const style = window.getComputedStyle(element);
    for (let i = 0; i < style.length; i++) {
        const property = style[i];
        const value = style.getPropertyValue(property);
        element.style.setProperty(property, value);
    }
}