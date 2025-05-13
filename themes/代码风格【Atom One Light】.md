---
author: 伏枥
banner: https://source.unsplash.com/random/300x400
banner_path: 
source_url: ""
digest: 
theme_name: 代码风格【Atom One Light】
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

Atom One Light by Daniel Gamage
Original One Light Syntax theme from https://github.com/atom/one-light-syntax

base:    #fafafa
mono-1:  #383a42
mono-2:  #686b77
mono-3:  #a0a1a7
hue-1:   #0184bb
hue-2:   #4078f2
hue-3:   #a626a4
hue-4:   #50a14f
hue-5:   #e45649
hue-5-2: #c91243
hue-6:   #986801
hue-6-2: #c18401

*/

.cnblogs-markdown .hljs {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  color: #383a42 !important;
  background: #fafafa !important;
  font-size:13px !important;
  font-family: 'Source Code Pro', Menlo, Consolas, Monaco, monospace !important;
}

.hljs-comment,
.hljs-quote {
  color: #a0a1a7;
  font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #a626a4;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst,
.hljs-tag {
  color: #e45649;
}

.hljs-literal {
  color: #0184bb;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta-string {
  color: #50a14f;
}

.hljs-built_in,
.hljs-class .hljs-title {
  color: #c18401;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #986801;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #4078f2;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-link {
  text-decoration: underline;
}
```