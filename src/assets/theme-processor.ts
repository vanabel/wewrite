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
    private  applyStyleDeclarationsToElementStyleProperty(element: HTMLElement, styles: CSSStyleDeclaration, computedStyle: CSSStyleDeclaration) {

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