import { sanitizeHTMLToDom } from "obsidian";
import postcss from "postcss";

export function parseCSS(css: string) {
	return postcss.parse(css);
}
export function ruleToStyle(rule: postcss.Rule) {
	let style = '';	
	rule.walkDecls(decl => {
		style += decl.prop + ':' + decl.value + ';';
	})

	return style;
}

function applyStyle(root: HTMLElement, cssRoot: postcss.Root) {
    // console.log(`applyStyle`, root, cssRoot);
    
	const cssText = root.style.cssText;
	cssRoot.walkRules(rule => {
		if (root.matches(rule.selector)) {
			rule.walkDecls(decl => {
				// 如果已经设置了，则不覆盖
				const setted = cssText.includes(decl.prop);
				if (!setted || decl.important) {
					root.style.setProperty(decl.prop, decl.value);
				}
			})
		}
	});

	
	if (root.tagName === 'svg') {
		return;
	}

	let element = root.firstElementChild;
	while (element) {
		applyStyle(element as HTMLElement, cssRoot);
	  	element = element.nextElementSibling;
	}
}

/**
 * 
 * @param html, the content of aritile 
 * @param css, customized css content 
 * @returns 
 */
export function applyCSS(html: string, css: string) {
	const doc = sanitizeHTMLToDom(html);
	const root = doc.firstChild as HTMLElement;
    try{

        const cssRoot = postcss.parse(css);
        // console.log(`applyCSS:`, root, cssRoot);
        applyStyle(root, cssRoot);
    }catch(e){
        console.error(`applyCSS error:`, e);
    }
	removeClassName(root);
	return root.outerHTML;
}

export function removeClassName(root:HTMLElement){
	root.className = '';
	root.removeAttribute('class')
	let element = root.firstElementChild;
	while (element) {
		removeClassName(element as HTMLElement);
	  	element = element.nextElementSibling;
	}
}