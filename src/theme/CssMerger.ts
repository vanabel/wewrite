/**
 * to build custom css for wewrite.
 * author: Learner Chen <learner.chen@icloud.com>
 * date: 2025-05-10
 */

import postcss from 'postcss';

type Rule = Map<string, postcss.Declaration>;
type Rules = Map<string, Rule>;

const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*[^)]+)?\s*\)/g;
const regexVarFallback = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g

export class CSSMerger {
    baseAST: postcss.Root | undefined;
    overrideAST: postcss.Root | undefined;
    vars: Map<string, string> = new Map()
    rules: Rules = new Map()

    constructor(private baseCSS: string, private overrideCSS: string) { }

    async init() {
        this.baseAST = (await postcss().process(this.baseCSS, { from: undefined })).root;
        this.overrideAST = (await postcss().process(this.overrideCSS, { from: undefined })).root;
    }
    private mergeVariables(): void {
        this.vars.clear();
        this.pickVariables(this.baseAST!, this.vars);
        this.pickVariables(this.overrideAST!, this.vars);


    }
    private meregeRules(): void {

        this.rules.clear();
        this.pickRules(this.baseAST!, this.rules);
        this.pickRules(this.overrideAST!, this.rules);
    }
    private resolveCssVars(value: string, vars: Map<string, string>, depth = 0): string {
        const MAX_DEPTH = 10; // 防止无限循环
        const varRegex = /var\(\s*--([a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g;

        let result = value;
        let replaced;

        do {
            replaced = false;
            result = result.replace(varRegex, (_, varName, fallback) => {
                const fullKey = `--${varName}`;
                if (vars.has(fullKey)) {
                    const replacement = vars.get(fullKey)!;
                    replaced = true;
                    return replacement;
                } else if (fallback !== undefined) {
                    replaced = true;
                    return fallback;
                } else {
                    console.warn(`Variable ${fullKey} not found and no fallback provided`);
                    return '';
                }
            });

            depth++;
        } while (replaced && depth < MAX_DEPTH);

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
                    this.resolveCssVars(decl.value, this.vars)
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

    async prepare() {
        await this.init();
        this.mergeVariables();
        this.meregeRules();
    }
    applyStyleToElement(currentNode: HTMLElement) {
        this.rules.forEach((rule, selector) => {
            try {
                if (currentNode.matches(selector)) {
                    rule.forEach((decl, prop) => {
                        let value = this.resolveCssVars(decl.value, this.vars);
                        currentNode.style.setProperty(prop, decl.important ? value + ' !important' : value);
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
