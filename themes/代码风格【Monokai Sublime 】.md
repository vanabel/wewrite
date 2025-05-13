---
author: 伏枥
banner: https://source.unsplash.com/random/300x400
banner_path: 
source_url: ""
digest: 
theme_name: 代码风格【Monokai Sublime 】
show-code-line-number: "0"
---
# 1. 基本代码控制

```CSS
:root {
	--code-containe-background-color: #1E1E1E;
	--code-section-background-color: #282c34;
	--code-color: #abb2bf;
	--code-comment-color: #5c6370;
	--code-keyword-color: #c678dd;
	--code-name-color: #e06c75;
	--code-literal-color: #56b6c2;
	--code-string-color: #98c379;
	--code-variable-color: #d19a66;
	--code-symbol-color: #61aeee;
	--code-class-color: #e6c07b;
	--code-line-height: 1.6rem;
	--code-line-color: rgb(253, 247, 247);
	--code-font-size: 0.9rem;
	--code-padding: 8px;
	--code-border-radius: 6px;
}
```

# 2. code
```CSS
/*

Monokai Sublime style. Derived from Monokai by noformnocontent http://nn.mit-license.org/

*/

.cnblogs-markdown .hljs {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  background: #23241f !important;
  color:white;
  font-size:13px !important;
  font-family: 'Source Code Pro', Menlo, Consolas, Monaco, monospace !important;
}

.hljs,
.hljs-tag,
.hljs-subst {
  color: #f8f8f2;
}

.hljs-strong,
.hljs-emphasis {
  color: #a8a8a2;
}

.hljs-bullet,
.hljs-quote,
.hljs-number,
.hljs-regexp,
.hljs-literal,
.hljs-link {
  color: #ae81ff;
}

.hljs-code,
.hljs-title,
.hljs-section,
.hljs-selector-class {
  color: #a6e22e;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-name,
.hljs-attr {
  color: #f92672;
}

.hljs-symbol,
.hljs-attribute {
  color: #66d9ef;
}

.hljs-params,
.hljs-class .hljs-title {
  color: #f8f8f2;
}

.hljs-string,
.hljs-type,
.hljs-built_in,
.hljs-builtin-name,
.hljs-selector-id,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-addition,
.hljs-variable,
.hljs-template-variable {
  color: #e6db74;
}

.hljs-comment,
.hljs-deletion,
.hljs-meta {
  color: #75715e;
}
```