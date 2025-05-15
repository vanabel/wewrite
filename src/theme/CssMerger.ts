/**
 * to build custom css for wewrite.
 * author: Learner Chen <learner.chen@icloud.com>
 * date: 2025-05-10
 */

import postcss from 'postcss';

import wewriteCSS from '../assets/default-styles/00_wewrite.css';
import articleCSS from '../assets/default-styles/01_article.css';
import linksCSS from '../assets/default-styles/02_links.css';
import footnoteCSS from '../assets/default-styles/03_footnote.css';
import imageCSS from '../assets/default-styles/04_image.css';
import tableCSS from '../assets/default-styles/05_table.css';
import codeCSS from '../assets/default-styles/06_code.css';
import blockquoteCSS from '../assets/default-styles/07_blockquote.css';
import calloutCSS from '../assets/default-styles/08_callout.css';
import admonitionCSS from '../assets/default-styles/09_admonition.css';
import mathCSS from '../assets/default-styles/10_math.css';
import mermaidCSS from '../assets/default-styles/11_mermaid.css';
import chartCSS from '../assets/default-styles/12_chart.css';
import listCSS from '../assets/default-styles/13_list.css';
import summaryCSS from '../assets/default-styles/14_summary.css';
import iconizeCSS from '../assets/default-styles/15_icon.css';

const baseCSS = [
	wewriteCSS,
	articleCSS,
	linksCSS,
	footnoteCSS,
	imageCSS,
	tableCSS,
	codeCSS,
	blockquoteCSS,
	calloutCSS,
	admonitionCSS,
	mathCSS,
	mermaidCSS,
	chartCSS,
	listCSS,
	summaryCSS,
	iconizeCSS
]





type Rule = Map<string, postcss.Declaration>;
type Rules = Map<string, Rule>;

// const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*[^)]+)?\s*\)/g;
// const regexVarFallback = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g
const regexVarFallback = /(^|\s|\(|,)var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]*))?\s*\)/g;

export class CSSMerger {
	baseAST: postcss.Root | undefined;
	overrideAST: postcss.Root | undefined;
	vars: Map<string, string> = new Map()
	rules: Rules = new Map()


	async init(customCSS: string) {
		// this.baseAST = (await postcss().process(this.baseCSS, { from: undefined })).root;
		await this.buildBaseCSS();
		const ast = (await postcss().process(customCSS, { from: undefined })).root;
		this.pickVariables(ast, this.vars);
		this.pickRules(ast, this.rules);

	}
	async buildBaseCSS() {
		this.vars.clear();
		this.rules.clear();
		for (const css of baseCSS) {
			const ast = (await postcss().process(css, { from: undefined })).root;
			this.pickVariables(ast, this.vars);
			this.pickRules(ast, this.rules);
		}
	}
	// const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g;
	// const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]*))?\s*\)/g;
	// private resolveCssVars(value: string, vars: Map<string, string>, depth = 0): string {
	//     const MAX_DEPTH = 10; // 防止无限循环
	// 	const varRegex = /(^|\s|\(|,)var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]*))?\s*\)/g;

	//     let result = value;
	//     let replaced;

	//     do {
	//         replaced = false;
	//         result = result.replace(varRegex, (_, varName, fallback) => {
	//             const fullKey = `--${varName}`;
	//             if (vars.has(fullKey)) {
	//                 const replacement = vars.get(fullKey)!;
	//                 replaced = true;
	//                 return replacement;
	//             } else if (fallback !== undefined) {
	//                 replaced = true;
	//                 return fallback;
	//             } else {
	//                 console.warn(`Variable ${fullKey} not found and no fallback provided`);
	//                 return '';
	//             }
	//         });

	//         depth++;
	//     } while (replaced && depth < MAX_DEPTH);

	//     return result;
	// }
	private resolveCssVars(value: string, vars: Map<string, string>, depth = 0): string {
		const MAX_DEPTH = 10; // 防止无限循环
		// const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]*))?\s*\)/g;
		const varRegex = /var\(\s*--([\w-]+)(?:\s*,\s*((?:\((?:[^()]|\([^()]*\))*\)|[^)\s]|[\s\S])*?))?\s*\)/g;
		let result = value;
		let replaced: boolean;

		do {
			replaced = false;

			result = result.replace(varRegex, (_match, varName: string, fallback: string | undefined) => {

				const fullKey = `--${varName}`;
				// if (fullKey === '--code-color') {
				// 	console.log(`css vars matching: ${value} => ${_match}`);
				// }
				if (vars.has(fullKey)) {
					const replacement = vars.get(fullKey)!;
					replaced = true;
					// if (fullKey === '--code-color') {
					// 	console.log(`css vars full-key replacement: ${value} => ${replacement}`);
					// }
					return replacement;
				} else if (fallback !== undefined) {
					replaced = true;
					// if (fullKey === '--code-color') {
					// 	console.log(`css vars fallback replacement: ${value} => ${fallback}`);
					// }
					return fallback;
				} else {
					console.warn(`Variable ${fullKey} not found and no fallback provided`);
					return '';
				}
			});

			depth++;
		} while (replaced && depth < MAX_DEPTH);
		// console.log(`css vars replacement: ${value} => ${result}`);

		return result;
	}

	private pickRules(root: postcss.Root, rules: Rules): void {
		root.walkRules(rule => {
			if (rule.selector !== ':root') {
				// if the rule exists in the base CSS, processed already.
				let selectedRule = rules.get(rule.selector);
				if (!selectedRule) {
					selectedRule = new Map();
					rules.set(rule.selector, selectedRule);
				}
				rule.walkDecls(decl => {
					// for each declaration under the rule, check if the value contains var(), replace it.
					// this.resolveCssVars(decl.value, this.vars)
					//push it to the selected rule. could replace original one if it exists.
					const baseDecl = selectedRule.get(decl.prop);

					if (baseDecl === undefined || !baseDecl.important || decl.important) {
						selectedRule.set(decl.prop, decl);
					} else {
						// console.log(`${rule.selector} skip ${decl.prop}`);
					}
				})
			}
		})
	}
	private pickVariables(root: postcss.Root, vars: Map<string, string>): void {
		root.walkRules(rule => {
			if (rule.selector === ':root') {
				rule.walkDecls(decl => {
					if (decl.prop.startsWith('--')) {
						//push to vars
						vars.set(decl.prop, decl.value);
					}
				});
			}
		})
	}

	applyStyleToElement(currentNode: HTMLElement) {
		this.rules.forEach((rule, selector) => {
			try {
				if (currentNode.matches(selector)) {
					rule.forEach((decl, prop) => {
						let value = this.resolveCssVars(decl.value, this.vars);
						currentNode.style.setProperty(prop, decl.important ? value + ' !important' : value);
						if (selector.includes('img::after')) {
							console.log(`image caption[${selector}]: ${decl.value} => ${value}`);
						}
					})
				}
			} catch (error) {
				console.log('error selector=>', selector, ' | Error=>', error.message);
			}
		})
		let element = currentNode.firstElementChild;
		while (element) {
			this.applyStyleToElement(element as HTMLElement);
			element = element.nextElementSibling;
		}
		return currentNode;
	}
	removeClassName(root: HTMLElement) {
		root.removeAttribute('class');
		let element = root.firstElementChild;
		while (element) {
			this.removeClassName(element as HTMLElement);
			element = element.nextElementSibling;
		}
	}
}
