/**
 * Apply customer css to article
 * 
 */
import postcss from "postcss";
import { compileCSS } from "src/compile-css";

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

	let element = root.firstElementChild;
	while (element) {
		applyStyle(element as HTMLElement, cssRoot);
	  	element = element.nextElementSibling;
	}
}

export function applyCSS(root:Node|null, css: string) {
    try{

        const cssRoot = compileCSS(css)
        applyStyle(root as HTMLElement, cssRoot);
    }catch(e){
        console.error(`applyCSS error:`, e);
    }
	removeClassName(root as HTMLElement);
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