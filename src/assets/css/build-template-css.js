// import * as fs from 'fs';
// import * as path from 'path';
const fs = require('fs');
const path = require('path');

// 定义 CSS 文件目录
const cssDir = './src/assets/default-styles'
const targetTSFile = './src/assets/css/template-css.ts'

// 读取目录下的所有文件
fs.readdir(cssDir, (err, files) => {
    if (err) {
        console.error('无法读取目录:', err);
        return;
    }

    // 过滤出所有的 CSS 文件
    const cssFiles = files.filter(file => path.extname(file).toLowerCase() === '.css');

    // 初始化一个空字符串来存储合并后的 CSS 内容
    let combinedCss = '';

    // 读取每个 CSS 文件的内容并合并
    cssFiles.forEach(file => {
        const filePath = path.join(cssDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        combinedCss += fileContent + '\n';
    });

    // 将合并后的 CSS 内容保存到一个字符串变量中
    const cssString = `export const combinedCss = \`${combinedCss}\`;`;

    // 将字符串变量写入 build-template.ts 文件
    fs.writeFileSync(targetTSFile, cssString, 'utf8');

    console.log(`CSS 文件内容已合并并保存到${targetTSFile} `);
});
// export {}
