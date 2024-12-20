export const DEFAULT_STYLE = `

/*

* PrismJS default theme

* 这个文件只应该包含变量

*/

/*

* Default bear theme，适用于 core/mweb-bear.scss。

* 所有 bear 主题，只需 import 这个文件，然后修改配色方案即可。

*/

/* font */

/* container */

/* spacing */

/* color */

/* other */

/**

* 在 bear 的主题中，某些变量的取值和其他变量是绑定的。

* 统一写在这里，这个文件应该在变量文件的最后被引入。

*/

/**

* Bear 的默认样式表。通过调整各个颜色变量的取值，就可以得到不同的 bear 主题。

* Bear 的配色方案位于 src/themes/bear-palettes 目录下。

*/

.wewrite-mp {

 font-family: AvenirNext-Regular, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;

 font-size: 16px;

 color: black;

 background-color: white;

 line-height: 1.6em;

 -webkit-text-size-adjust: 100%;

 margin: 0px 0px;

 padding: 1em 1em;

 /* 代码块 */

}

.wewrite-mp * {

 -moz-box-sizing: border-box;

 -webkit-box-sizing: border-box;

 box-sizing: border-box;

 -webkit-font-smoothing: antialiased;

 text-rendering: optimizeLegibility;

}

.wewrite-mp > *:first-child {

 margin-top: 0 !important;

}

.wewrite-mp > *:last-child {

 margin-top: 0 !important;

}

.wewrite-mp p,

.wewrite-mp pre,

.wewrite-mp dl,

.wewrite-mp form,

.wewrite-mp details,

.wewrite-mp dl,

.wewrite-mp blockquote,

.wewrite-mp table,

.wewrite-mp xmp,

.wewrite-mp plaintext,

.wewrite-mp listing,

.wewrite-mp figure {

 margin: 0.75em 0 0.45em;

}

.wewrite-mp hr {

 margin: 0.75em auto;

}

.wewrite-mp h1,

.wewrite-mp h2,

.wewrite-mp h3,

.wewrite-mp h4,

.wewrite-mp h5,

.wewrite-mp h6 {

 margin-top: 1.5em;

 margin-bottom: 0.75em;

 margin-left: 0;

 margin-right: 0;

 font-family: AvenirNext-Medium;

 font-weight: 600;

 line-height: 1.5em;

 color: red; /* rgb(80, 250, 123);*/

}

.wewrite-mp h1 {

 font-size: 1.5em;
 color: red;

}

.wewrite-mp h2 {

 font-size: 1.3em;

}

.wewrite-mp h3 {

 font-size: 1.1em;

}

.wewrite-mp h4 {

 font-size: 1em;

}

.wewrite-mp h5 {

 font-size: 1em;

}

.wewrite-mp h6 {

 font-size: 1em;

}

.wewrite-mp hr {

 height: 1px;

 border: 0;

 background-color: rgba(187, 145, 248, 0.4);

 border-style: inset;

 border-width: 1px;

}

.wewrite-mp p {

 margin-left: 0;

 margin-right: 0;

}

.wewrite-mp pre,

.wewrite-mp pre[class*=language-] {

 padding: 0;

 border: 0;

}

.wewrite-mp blockquote {

 display: block;

 padding-left: 0.8em;

 border-left: 0.2em solid rgb(205, 174, 249);

 color: brown;

}

.wewrite-mp blockquote > :first-child {

 margin-top: 0;

}

.wewrite-mp blockquote > :last-child {

 margin-bottom: 0;

}

.wewrite-mp li {

 word-wrap: break-all;

}

.wewrite-mp ul {

 margin-left: 1.3em;

 padding: 0;

}

.wewrite-mp li::marker {

 color: rgb(205, 174, 249);

}

.wewrite-mp li > p {

 margin: 0;

}

.wewrite-mp ol {

 margin-left: 1.3em;

 padding: 0;

 list-style-type: decimal;

}

.wewrite-mp .task-list-item {

 list-style-type: none;

 text-indent: -1.5em;

}

.wewrite-mp .task-list-item:before {

 content: "";

 display: static;

 margin-right: 0px;

}

.wewrite-mp .task-list-item > input[type=checkbox] {

 text-indent: -1.7em;

}

.wewrite-mp img {

 max-width: 100%;

 height: auto;

}

.wewrite-mp u {

 text-decoration: none;

 background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgb(205, 174, 249) 50%);

 background-repeat: repeat-x;

 background-size: 2px 2px;

 background-position: 0 1em;

}

.wewrite-mp a {

 color: rgb(139, 233, 253);

 text-decoration: none;

}

.wewrite-mp a:hover, .wewrite-mp a:focus, .wewrite-mp a:active {

 text-decoration: underline;

}

.wewrite-mp a img {

 border: none;

}

.wewrite-mp b,

.wewrite-mp strong {

 font-weight: bold;

}

.wewrite-mp i,

.wewrite-mp cite,

.wewrite-mp em,

.wewrite-mp var,

.wewrite-mp address,

.wewrite-mp dfn {

 font-style: italic;

}

.wewrite-mp del,

.wewrite-mp s {

 color: rgb(178, 184, 163);

}

.wewrite-mp pre,

.wewrite-mp xmp,

.wewrite-mp plaintext,

.wewrite-mp listing,

.wewrite-mp code,

.wewrite-mp kbd,

.wewrite-mp tt,

.wewrite-mp samp {

 font-family: Menlo-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;

}

.wewrite-mp mark {

 color: inherit;

 display: inline;

 padding: 0.2em 0.5em;

 background-color: rgb(95, 99, 117);

}

.wewrite-mp figcaption {

 text-align: center;

}

.wewrite-mp table {

 color: rgb(249, 249, 245);

 border-collapse: collapse;

 background-color: rgb(31, 32, 42);

 border-spacing: 2px;

 font-size: 1em;

 border: 1px;

 border-spacing: 0;

}

.wewrite-mp th,

.wewrite-mp td {

 padding: 0.7em 1em;

 font-size: 0.9em;

 border: 1px solid rgba(187, 145, 248, 0.4);

}

.wewrite-mp caption,

.wewrite-mp th,

.wewrite-mp td {

 text-align: left;

 font-weight: normal;

 vertical-align: middle;

}

.wewrite-mp div[id^=mweb-chart-ele] svg {

 background-color: white;

}

.wewrite-mp .footnotes > ol li {

 text-indent: 0;

}

.wewrite-mp .footnotes > ol li::before {

 float: left;

}

.wewrite-mp .footnotes hr {

 margin-top: 4em;

 margin-bottom: 0.5em;

}

.wewrite-mp code {

 display: inline;

 color: rgb(249, 249, 245);

}

.wewrite-mp .code-section {

 display: flex;

 border: solid 1px rgba(187, 145, 248, 0.4);

 background-color: rgb(31, 32, 42);

}

.wewrite-mp .code-section pre {

 margin: 0;

 overflow-x: auto;

}

.wewrite-mp .code-section code {

 display: block;

 padding: 0.9em;

 font-size: 0.9em;

 line-height: 1.6em;

 text-wrap: nowrap;

 background-color: rgb(31, 32, 42);

}

.wewrite-mp .code-section ul {

 flex-shrink: 0;

 counter-reset: line;

 margin: 0;

 padding: 0.9em 0 0.9em 0.9em;

 white-space: normal;

 width: fit-content;

}

.wewrite-mp .code-section ul > li {

 position: relative;

 margin: 0;

 padding: 0;

 display: list-item;

 text-align: right;

 text-wrap: nowrap;

 line-height: 1.6em;

 font-size: 0.9em;

 font-family: Menlo-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;

 padding: 0;

 list-style-type: none;

 color: rgb(255, 255, 255);

}

.wewrite-mp .code-section ul > li::marker {

 content: none;

}

pre code.hljs {

 display: block;

 overflow-x: auto;

 padding: 1em

}

code.hljs {

 padding: 3px 5px

}

/*!

* Theme: FelipeC

* Author: (c) 2021 Felipe Contreras <felipe.contreras@gmail.com>

* Website: https://github.com/felipec/vim-felipec

*

* Autogenerated with vim-felipec's generator.

*/

.hljs {

 color: #dddde1;

 background: #1e1e22

}

.hljs::selection,

.hljs ::selection {

 color: #1e1e22;

 background: #bf8fef

}

.hljs-comment,

.hljs-code,

.hljs-quote {

 color: #888896

}

.hljs-number,

.hljs-literal,

.hljs-deletion {

 color: #ef8f8f

}

.hljs-punctuation,

.hljs-meta,

.hljs-operator,

.hljs-subst,

.hljs-doctag,

.hljs-template-variable,

.hljs-selector-attr {

 color: #efbf8f

}

.hljs-type {

 color: #efef8f

}

.hljs-tag,

.hljs-title,

.hljs-selector-class,

.hljs-selector-id {

 color: #bfef8f

}

.hljs-string,

.hljs-regexp,

.hljs-addition {

 color: #8fef8f

}

.hljs-class,

.hljs-property {

 color: #8fefbf

}

.hljs-name,

.hljs-selector-tag {

 color: #8fefef

}

.hljs-keyword,

.hljs-built_in {

 color: #8fbfef

}

.hljs-section,

.hljs-bullet {

 color: #8f8fef

}

.hljs-selector-pseudo {

 color: #bf8fef

}

.hljs-variable,

.hljs-params,

.hljs-attr,

.hljs-attribute {

 color: #ef8fef

}

.hljs-symbol,

.hljs-link {

 color: #ef8fbf

}

.hljs-strong,

.hljs-literal,

.hljs-title {

 font-weight: bold

}

.hljs-emphasis {

 font-style: italic

}

`