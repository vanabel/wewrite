---
author: 伏枥
banner: https://source.unsplash.com/random/300x400
banner_path: 
source_url: ""
digest: 
theme_name: 代码风格【atom-one-dark-reasonable】
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

Atom One Dark With support for ReasonML by Gidi Morris, based off work by Daniel Gamage

Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax

*/
.cnblogs-markdown .hljs {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  color: #abb2bf !important;
  background: #282c34 !important;
  color:white;
  font-size:13px !important;
  font-family: 'Source Code Pro', Menlo, Consolas, Monaco, monospace !important;
}
.hljs-keyword, .hljs-operator {
  color: #F92672;
}
.hljs-pattern-match {
  color: #F92672;
}
.hljs-pattern-match .hljs-constructor {
  color: #61aeee;
}
.hljs-function {
  color: #61aeee;
}
.hljs-function .hljs-params {
  color: #A6E22E;
}
.hljs-function .hljs-params .hljs-typing {
  color: #FD971F;
}
.hljs-module-access .hljs-module {
  color: #7e57c2;
}
.hljs-constructor {
  color: #e2b93d;
}
.hljs-constructor .hljs-string {
  color: #9CCC65;
}
.hljs-comment, .hljs-quote {
  color: #b18eb1;
  font-style: italic;
}
.hljs-doctag, .hljs-formula {
  color: #c678dd;
}
.hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst, .hljs-tag {
  color: #e06c75;
}
.hljs-literal {
  color: #56b6c2;
}
.hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string {
  color: #98c379;
}
.hljs-built_in, .hljs-class .hljs-title {
  color: #e6c07b;
}
.hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number {
  color: #d19a66;
}
.hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title {
  color: #61aeee;
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