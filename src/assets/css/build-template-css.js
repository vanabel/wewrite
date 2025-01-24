/**
 * @description merge css files to one file as default CSS for rendering. 
 * @author Learner
 * @date 2025-01-07
 */

const fs = require('fs');
const path = require('path');

const cssDir = './src/assets/default-styles'
const targetTSFile = './src/assets/css/template-css.ts'
const defaultThemeFile = './themes/wewrite-default-theme.md'

const date = new Date();
const formattedDate = date.toISOString().split('T')[0];

const frontmatter_template = `---
author: wewrite
theme_name: wewrite default theme
created_at: ${formattedDate}
---
`

fs.readdir(cssDir, (err, files) => {
    if (err) {
        console.error('无法读取目录:', err);
        return;
    }

    const cssFiles = files.filter(file => path.extname(file).toLowerCase() === '.css');

    let combinedCss = '';

    cssFiles.forEach(file => {
        const filePath = path.join(cssDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        combinedCss += fileContent + '\n';
    });

    const cssString = `export const combinedCss = \`${combinedCss}\`;`;
    const mdString = frontmatter_template + '\n\n# Default wewrite style\n\n```CSS\n' + combinedCss + '\n```'

    

    fs.writeFileSync(targetTSFile, cssString, 'utf8');
    fs.writeFileSync(defaultThemeFile, mdString, 'utf8');

});
