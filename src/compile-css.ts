/**
 * CSS compiling for custom theme 
 */
import postcss from 'postcss';


export function compileCSS(cssContent: string) {

    const root = postcss.parse(cssContent);
    const variables: { [key: string]: string } = {};

    // 提取 CSS 变量
    root.walkRules(':root', rule => {
        rule.walkDecls(decl => {
            if (decl.prop.startsWith('--')) {
                variables[decl.prop] = decl.value;
            }
        });
    });
    

    // 替换变量
    root.walkDecls(decl => {
        Object.keys(variables).forEach(variable => {
            const regex = new RegExp(`var\\(${variable}\\)`, 'g');
            decl.value = decl.value.replace(regex, variables[variable]);
        });
    });

    // 移除 :root 规则
    root.walkRules(':root', rule => {
        rule.remove();
    });

    // 生成新的 CSS 内容
    
    const newCssContent = root.toString();
    return root
    // return newCssContent;
}