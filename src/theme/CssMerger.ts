import { parse } from 'css';
import { stringify } from 'css';

type CSSVariableMap = Record<string, string>;
type CSSRule = {
  selector: string;
  declarations: Record<string, string>;
  specificity: number;
};

// CSS处理工具类
class CSSMerger {
  private variables: CSSVariableMap = {};
  private rules: CSSRule[] = [];

  // 解析并合并CSS
  addCSS(css: string) {
	const ast = parse(css);
	
	// 处理CSS变量
	ast.stylesheet?.rules.forEach(rule => {
	  if (rule.type === 'rule' && rule.selectors?.includes(':root')) {
		rule.declarations?.forEach(decl => {

		  if (decl.type === 'declaration' && decl.property !== undefined && decl.property.startsWith('--')) {
			if (decl.value === undefined || decl.property === undefined) {
			  //throw new Error(`Variable ${decl.property} has no value`);
			}else {
				this.variables[decl.property] = decl.value;
			}
		  }
		});
	  }
	});

	// 处理普通规则
	ast.stylesheet?.rules.forEach(rule => {
	  if (rule.type === 'rule' && !rule.selectors?.includes(':root')) {
		rule.selectors?.forEach(selector => {
		  const declarations: Record<string, string> = {};
		  
		  rule.declarations?.forEach(decl => {
			if (decl.type === 'declaration') {
			  // 替换CSS变量
			  let value = decl.value!.replace(/var\((--[a-z-]+)\)/g, 
				(_, varName) => this.variables[varName] || ''
			  );
			  
			  // 特殊处理颜色值
			  if (decl.property === 'background-color' && value.startsWith('#')) {
				value = value.toLowerCase();
			  }
			  if (decl.property === undefined || value === undefined) {
			  }else {
			  declarations[decl.property] = value;
			  }
			}
		  });

		  this.rules.push({
			selector,
			declarations,
			specificity: this.calculateSpecificity(selector)
		  });
		});
	  }
	});
  }

  // 计算选择器优先级
  private calculateSpecificity(selector: string): number {
	const idCount = (selector.match(/#/g) || []).length;
	const classCount = (selector.match(/\./g) || []).length;
	const elementCount = (selector.match(/(^|[^.#])[a-zA-Z]+/g) || []).length;
	return idCount * 100 + classCount * 10 + elementCount;
  }

  // 生成内联样式
  getInlineStyle(className: string, tagName: string): string {
	const matchedRules = this.rules.filter(rule => 
	  rule.selector === `.${className}` || 
	  rule.selector === tagName
	);

	// 按优先级和出现顺序排序
	const sortedRules = matchedRules.sort((a, b) => 
	  b.specificity - a.specificity || 
	  this.rules.indexOf(a) - this.rules.indexOf(b)
	);

	// 合并声明
	const styleMap: Record<string, string> = {};
	sortedRules.forEach(rule => {
	  Object.assign(styleMap, rule.declarations);
	});

	// 转换为字符串
	return Object.entries(styleMap)
	  .map(([prop, value]) => `${prop}: ${value}`)
	  .join('; ');
  }
}
