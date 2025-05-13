export const combinedCss = `.admonition {
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.admonition.no-title .admonition-content {
    margin-top: 0;
    margin-bottom: 0;
}

.admonition li.task-list-item.is-checked p {
    text-decoration: line-through;
}

.admonition.no-drop {
    box-shadow: none;
}

.admonition.no-drop>.admonition-title.no-title+.admonition-content,
.admonition.no-drop .admonition .admonition-title.no-title+.admonition-content {
    margin-top: 0;
    margin-bottom: 0;
}

.admonition.no-drop .admonition .admonition-content {
    border-right: .0625em solid rgba(233, 233,123, .2);
    border-bottom: .0625em solid rgba(233, 233,123, .2);
}

.admonition.no-drop .admonition .admonition-title.no-title+.admonition-content {
    border-top: .0625em solid rgba(233, 233,123, .2);
}

:is(.markdown-source-view.mod-cm6) .admonition .math-block>mjx-container,
:is(.markdown-reading-view) .admonition .math-block>mjx-container {
    display: block;
    text-align: center;
    padding: 1em;
}

:is(.markdown-reading-view) .admonition .math-block>mjx-container {
    padding: .0625em;
}

*:not(.is-live-preview) .admonition.no-content {
    display: none;
}

.admonition {
    margin-top: 0px;
    margin-bottom: .75em;
}

.admonition.no-content {
    opacity: .1;
}

.admonition-content p {
    line-height: inherit;
    margin: revert;
}

.admonition-content p br {
    display: initial;
}

.admonition-content p ul>li>ul {
    border-left: 2px;
    border-left-color: #ababab;
    border-left-style: solid;
}

.admonition-content:first-child {
    margin-top: .8em;
}

.admonition-content:last-child {
    margin-bottom: .8em;
}

.admonition-title.no-title {
    display: none;
}

.admonition-title:hover+.admonition-content .admonition-content-copy {
    opacity: .7;
}

.admonition-content,
.callout-content {
    position: relative;
}

.admonition-content-copy {
    color: #ababab;
    cursor: pointer;
    opacity: 0;
    position: absolute;
    margin: .375em;
    right: 0;
    top: 0;
    transition: .3s opacity ease-in;
}

.admonition-content-copy:hover {
    color: inherit;
}

.admonition:hover .admonition-content-copy,
.callout:hover .admonition-content-copy,
.admonition-content-copy:hover {
    opacity: 1;
}


.admonition-content ul,
.admonition-content ol {
    white-space: normal;
}

.admonition-title-icon,
.fa {
    height: 1.2em;
    width: 1.2em;
}
/* 总体页面  */
.wewrite {
	background-color: var(--wechat-bg-color, none);
	padding: var(--wechat-padding, 1em);
	margin: var(--wechat-margin, 0);
	line-height: var(--wechat-line-height, 1.5);
}
/* 正文文字 */
.wewrite {
	color: var(--wechat-text-color, #333);
	font-size: var(--wechat-text-font-size, 16px);
	font-family: var(--wechat-text-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
	font-weight: var(--wechat-text-font-weight, 400);
	word-break: var(--wechat-text-word-break, break-word);
	letter-spacing: var(--wechat-text-letter-space, 0px);
}

/* 标题 */
.wewrite h1,
.wewrite h2,
.wewrite h3,
.wewrite h4,
.wewrite h5,
.wewrite h6 {
	color: var(--wechat-heading-color, #333);
	font-weight: var(--wechat-heading-font-weight, 600);
	line-height: var(--wechat-heading-line-height, 1.5);
}
/* .wewrite {
	min-width: 200px;
	max-width: 760px;
	padding: 1em 1em 1em 1em;
	font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
	word-break: break-word;
	line-height: 1.75;
	font-weight: 400;
	font-size: 16px;
	overflow-x: hidden;
	color: #333;
	margin: 0px;

} */

/* headings 标题*/


/* .wewrite h1:first-child,
.wewrite h2:first-child,
.wewrite h3:first-child,
.wewrite h4:first-child,
.wewrite h5:first-child,
.wewrite h6:first-child {
	margin-top: 1.5em;
	margin-bottom: 1em;
}

.wewrite h1::before,
.wewrite h2::before,
.wewrite h3::before,
.wewrite h4::before,
.wewrite h5::before,
.wewrite h6::before {
	content: "#";
	display: inline-block;
	color: #3eaf7c;
	padding-right: 0.23em;
} */

.wewrite h1 {
	position: relative;
	font-size: 2.5em;
	margin-bottom: 0.5em;
}

.wewrite h1::before {
	font-size: 1.5em;
}

.wewrite h2 {
	font-size: 2.2em;
	padding-bottom: 0.5em;
	/* border-bottom: 1px solid #ececec; */
}

.wewrite h3 {
	font-size: 1.5em;
	padding-bottom: 0;
}

.wewrite h4 {
	font-size: 1.25em;
}

.wewrite h5 {
	font-size: 1.15em;
}

.wewrite h6 {
	font-size: 1.05em;
	font-weight: 500;
}

/* @media (max-width: 720px) {
    .wewrite h1 {
      font-size: 24px;
    }
    .wewrite h2 {
      font-size: 20px;
    }
    .wewrite h3 {
      font-size: 18px;
    }
  } */

/* paragraph */
.wewrite p {
	line-height: inherit;
	margin-top: 22px;
	margin-bottom: 22px;
}

.wewrite strong {
	/* color: #3eaf7c; */
	font-weight: 600;
	color: rgb(0, 128, 128);
}

.wewrite img {
	max-width: 100%;
	border-radius: 2px;
	display: block;
	margin: auto;
	/* border: 3px solid rgba(62, 175, 124, 0.2); */
}

.wewrite hr {
	border-top: 1px solid var(--wechat-border-color, #eaeaea);
	border-bottom: none;
	border-left: none;
	border-right: none;
	margin-top: 2px;
	margin-bottom: 2px;
}

.wewrite .foot-links hr {
	margin-top: 2em;
	margin-bottom: 0.5em;
}

.wewrite a {
	font-weight: 500;
	text-decoration: none;
	color: var(--wechat-link-color, rgb(0, 102, 204));
}

.wewrite a:hover,
.wewrite a:active {
	border-bottom: 1.5px solid var(--wechat-link-color, rgb(0, 102, 204)); ;
}

.wewrite a:before {
	content: "⇲";
}


/* blockquote */
.wewrite blockquote {
	color: var(--wechat-quote-text-color, #333);
	font-family: var(--wechat-quote-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
	padding: var(--wechat-quote-padding, 1em);
	font-size: var(--wechat-quote-font-size, 16px);
	margin: 22px 0;
	border-left: var(--wechat-quote-border-left, 4px solid #eaeaea);
	background-color: var(--wechat-quote-bg-color, #f5f5f5);
}

.wewrite blockquote::after {
	display: block;
	content: "";
}

.wewrite blockquote>p {
	margin: 10px 0;
}

/* summary */
.wewrite details {
	border: none;
	outline: none;
	/* border-left: 4px solid #3eaf7c; */
	padding-left: var(--wechat-collapse-padding, 1em);
	margin-left: var(--wechat-collapse-margin, 0);
	background-color: var(--wechat-collapse-bg-color, #f5f5f5);
}

.wewrite details summary {
	cursor: pointer;
	border: none;
	outline: none;
	margin: 0px -17px;
}

.wewrite details summary::-webkit-details-marker {
	color: var(--wechat-collapse-bg-color, #f5f5f5);
}

/* list */
.wewrite ol,
.wewrite ul {
	padding-left: var(--wechat-list-pading-left, 2rem);
	margin: var(--wechat-list-margin, 0);
	list-style: none;
}

.wewrite ol li,
.wewrite ul li {
	margin-bottom: 0;
	list-style: inherit;
}

.wewrite ol li .task-list-item,
.wewrite ul li .task-list-item {
	list-style: none;
}

.wewrite ol li .task-list-item ul,
.wewrite ul li .task-list-item ul,
.wewrite ol li .task-list-item ol,
.wewrite ul li .task-list-item ol {
	margin-top: 0;
}

.wewrite ol ul,
.wewrite ul ul,
.wewrite ol ol,
.wewrite ul ol {
	margin-top: 3px;
}

.wewrite ol li {
	padding-left: 6px;
}



/* icon */

.obsidian-icon {
	font-size: inherit;
	display: inline-block;
	width: 2em !important;
	text-align: center;
	/* margin-right: -0.5em !important; */
}

p .obsidian-icon {
	width: 1.75em !important;
}

.obsidian-icon.react-icon>svg {
	vertical-align: middle;
	margin-bottom: 3px;
}

/* footnote */
.wewrite .footnote-id {
	color: var(--wechat-footnote-text-color, #999);
	margin-right: 0.5em;

}

.wewrite .footnote {
	font-size: 0.9em;
	font-weight: 300;
	margin-left: 0.5em;
}

/* Callout Styles */

.callout {
    overflow: hidden;
    border-style: solid;
    border-color: rgba(8, 109, 221, 0.25);
    border-width: 0px;
    border-radius: 4px;
    margin: 1em 0;
    background-color: rgba(8, 109, 221, 0.1);
    padding: 12px 12px 12px 24px;
}

.callout:not(.admonition).drop-shadow {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.callout:not(.admonition) .no-title {
    display: none;
}


@supports selector(:has(*)) {

    :has(.callout .callout-title .callout-title-inner:dir(rtl)),
    .callout:has(> .callout-title .callout-title-inner:dir(rtl)) {
        direction: rtl;
    }

    :has(.callout .callout-title .callout-title-inner:dir(rtl))>.callout-title,
    .callout:has(> .callout-title .callout-title-inner:dir(rtl))>.callout-title {
        direction: rtl;
        --direction: -1;
    }

    :has(.callout .callout-title .callout-title-inner:dir(rtl))>.callout-title .callout-icon svg.svg-icon,
    .callout:has(> .callout-title .callout-title-inner:dir(rtl))>.callout-title .callout-icon svg.svg-icon {
        transform: scale(-1, 1);
    }
}

.callout {
    background-color: rgba(8, 109, 221, 0.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}


.callout-icon {
    height: 1em;
}

.callout[data-callout="summary"] {
    background-color: rgba(0, 191, 188, 0.1);
}
.callout[data-callout="abstract"],
.callout[data-callout="tldr"] {
    background-color: rgba(0, 176, 255, 0.1);
}

.callout[data-callout="info"] {
    background-color: rgba(8, 109, 221, 0.1);
}

.callout[data-callout="todo"] {
    background-color: rgba(8, 109, 221, 0.1);
}

.callout[data-callout="important"] {
    background-color: rgba(8, 191, 188, 0.1);
}

.callout[data-callout="tip"],
.callout[data-callout="hint"] {
    background-color: rgba(8, 191, 188, 0.1);
}

.callout[data-callout="success"],
.callout[data-callout="check"],
.callout[data-callout="done"] {
    background-color: rgba(8, 185, 78, 0.1);

}

.callout[data-callout="question"],
.callout[data-callout="help"],
.callout[data-callout="faq"] {
    background-color: rgba(236, 117, 0, 0.1);
}

.callout[data-callout="warning"],
.callout[data-callout="caution"],
.callout[data-callout="attention"] {
    background-color: rgba(236, 117, 0, 0.1);
}

.callout[data-callout="failure"],
.callout[data-callout="fail"],
.callout[data-callout="missing"] {
    background-color: rgba(233, 49, 71, 0.1);
}

.callout[data-callout="danger"],
.callout[data-callout="error"] {
    background-color: rgba(233, 49, 71, 0.1);
}

.callout[data-callout="bug"] {
    background-color: rgba(233, 49, 71, 0.1);
}

.callout[data-callout="example"] {
    background-color: rgba(120, 82, 238, 0.1);
}

.callout[data-callout="quote"],
.callout[data-callout="cite"] {
    background-color: rgba(158, 158, 158, 0.1);
}

/* title start */
.callout.is-collapsible  {
    cursor: var(--cursor);
}


.callout-title {
    padding: 0;
    display: flex;
    gap: 4px;
    font-size: inherit;
    line-height: 1.3;
    align-items: flex-start;
    color: rgb(8, 109, 221);
}


.callout[data-callout="summary"] .callout-title  {
    color: rgb(0, 191, 188);
}
.callout[data-callout="abstract"] .callout-title ,
.callout[data-callout="tldr"] .callout-title {
    color: rgb(0, 176, 255);
}

.callout[data-callout="info"] .callout-title {
    color: rgb(8, 109, 221);
}

.callout[data-callout="todo"] .callout-title {
    color: rgb(8, 109, 221);
}

.callout[data-callout="important"] .callout-title {
    color: rgb(8, 191, 188);
}

.callout[data-callout="tip"] .callout-title ,
.callout[data-callout="hint"] .callout-title {
    color: rgb(8, 191, 188);
}

.callout[data-callout="success"] .callout-title ,
.callout[data-callout="check"] .callout-title ,
.callout[data-callout="done"] .callout-title {
    color: rgb(8, 185, 78);

}

.callout[data-callout="question"] .callout-title ,
.callout[data-callout="help"] .callout-title ,
.callout[data-callout="faq"] .callout-title {
    color: rgb(236, 117, 0);
}

.callout[data-callout="warning"] .callout-title ,
.callout[data-callout="caution"] .callout-title ,
.callout[data-callout="attention"] .callout-title {
    color: rgb(236, 117, 0);
}

.callout[data-callout="failure"] .callout-title ,
.callout[data-callout="fail"] .callout-title ,
.callout[data-callout="missing"] .callout-title {
    color: rgb(233, 49, 71);
}

.callout[data-callout="danger"]  .callout-title ,
.callout[data-callout="error"] .callout-title {
    color: rgb(233, 49, 71);
}

.callout[data-callout="bug"] .callout-title {
    color: rgb(233, 49, 71);
}

.callout[data-callout="example"] .callout-title {
    color: rgb(120, 82, 238);
}

.callout[data-callout="quote"] .callout-title ,
.callout[data-callout="cite"]  .callout-title {
    color: rgb(158, 158, 158);
}

/* title end */
.callout-content {
    overflow-x: auto;
    padding: 0; 
    background-color: transparent;
}

.callout-content .callout {
    margin-top: 20px;
}

.callout-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
}


.callout-icon::after {
    content: "\u200B";
}

.callout-title-inner {
    font-weight: 600; 
    color: inherit; 
}

.callout-fold {
    display: flex;
    align-items: center;
    padding-inline-end: 8px; 
}

.callout-fold::after {
    content: "\u200B";
}

.callout-fold .svg-icon {
    transition: transform 100ms ease-in-out;
}

.callout-fold.is-collapsed .svg-icon {
    transform: rotate(-1 * -1 * 90deg);
}


.wewrite .charts,
.wewrite .mermaid {
    display: flex;
    flex-direction: column;
    padding: 3px;
    border: solid 1px #ccc;
    border-radius: 3px;
}

.wewrite .charts image,
.wewrite .mermaid image
 {
    width: 100%;
    margin: auto;
}
/* code section */

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

.wewrite code {
	display: inline;
	color: var(--code-color, rgb(153, 153, 153));
	line-height: var(--code-line-height, 1.6rem);
}

.wewrite .code-container {
	display: flex;
	flex-direction: column;
	border-radius: var(--code-border-radius, 4px);
	background: var(--code-containe-background-color, #1E1E1E);
	box-shadow: rgba(0, 0, 0, 0.55) 0px 10px 10px -10px;
}


.wewrite .code-section-banner {
	/* background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="450px" height="130px"><ellipse cx="65" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)"></ellipse> <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)">  </ellipse>  <ellipse cx="385" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)">  </ellipse> </svg>'); */
	background-image: url('https://mmbiz.qpic.cn/mmbiz_svg/QAm7hEbaujTQuIH8VVl7W7PicH14grAZxd7oUx579CB2wpytwlLSpiaq2DXBpNUz8R6ckkAuO8tBLr52XjAsvR67mh3oibs2dYK/640?wx_fmt=svg&from=appmsg&tp=webp&wxfrom=15&wx_lazy=1');
	background-position: 10px 10px;
	background-size: 40px auto;
	background-repeat: no-repeat;
	display: inline-block;
	height: 32px;
	width: 100%;
}

/* https://mmbiz.qpic.cn/mmbiz_svg/QAm7hEbaujTQuIH8VVl7W7PicH14grAZxd7oUx579CB2wpytwlLSpiaq2DXBpNUz8R6ckkAuO8tBLr52XjAsvR67mh3oibs2dYK/640?wx_fmt=svg&from=appmsg&tp=webp&wxfrom=15&wx_lazy=1 */

.wewrite .code-section {
	display: flex;
	flex-grow: 1;
	font-size: var(--code-font-size, 0.9rem);
	line-height: var(--code-line-height, 1.6rem);
	border-radius: var(--code-border-radius, 4px);
}

.wewrite .code-section pre {
	position: relative;
	padding: 0;
	margin: 0;
	flex: 1;
	overflow: auto;
	border-radius: var(--code-border-radius, 4px);

}


.wewrite .code-section code {
	display: block;
	padding: 10px 5px !important;
	padding-left: .5em;
	font-family: Consolas, Monaco, Menlo, monospace;
	text-wrap: nowrap;
}

.wewrite .code-section ul {
	padding-top: var(--code-padding, 8px);
	padding-bottom: var(--code-padding, 8px);
	position: relative;
	overflow: hidden;
	background: var(--code-section-background-color, #282c34);
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	counter-reset: line;
	margin: 0;
	padding: 10px 3px 0 1rem;
	white-space: normal;
	width: fit-content;
	user-select: none;
	border-right: solid 0.5px var (--code-color, rgb(166, 166, 166));
	color: var(--code-line-color, green);
	border-radius: var(--code-border-radius, 4px);
}

.wewrite .code-section ul>li {
	position: relative;
	margin: 0;
	display: list-item;
	text-align: right;
	text-wrap: nowrap;
	line-height: var(--code-line-height, 1.6rem);
	font-size: var(--code-font-size, 0.9rem);
	font-family: Menlo-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
	list-style-type: none;
	color: var(--code-line-color, red);
	
}

.wewrite .code-section ul>li::marker {
	content: none;
}

.wewrite pre code .hljs {
	display: block;
	overflow-x: auto;
	padding: 1em
}

.wewrite code .hljs {
	padding: 3px 5px
}

/*
  
  Atom One Dark by Daniel Gamage
  Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax
  
  base:    #282c34
  mono-1:  #abb2bf
  mono-2:  #818896
  mono-3:  #5c6370
  hue-1:   #56b6c2
  hue-2:   #61aeee
  hue-3:   #c678dd
  hue-4:   #98c379
  hue-5:   #e06c75
  hue-5-2: #be5046
  hue-6:   #d19a66
  hue-6-2: #e6c07b
  
  */
.wewrite .hljs {
	color: var(--code-color, #abb2bf);
	background: var(--code-section-background-color, #282c34)
}

.wewrite .hljs-comment,
.wewrite .hljs-quote {
	color: var(--code-color, #5c6370);
	font-style: italic
}

.wewrite .hljs-doctag,
.wewrite .hljs-keyword,
.wewrite .hljs-formula {
	color: var(--code-keyword-color, #c678dd)
}

.wewrite .hljs-section,
.wewrite .hljs-name,
.wewrite .hljs-selector-tag,
.wewrite .hljs-deletion,
.wewrite .hljs-subst {
	color: var(--code-name-color, #e06c75)
}

.wewrite .hljs-literal {
	color: var(--code-literal-color, #56b6c2)
}

.wewrite .hljs-string,
.wewrite .hljs-regexp,
.wewrite .hljs-addition,
.wewrite .hljs-attribute,
.wewrite .hljs-meta .wewrite .hljs-string {
	color: var(--code-string-color, #98c379)
}

.wewrite .hljs-attr,
.wewrite .hljs-variable,
.wewrite .hljs-template-variable,
.wewrite .hljs-type,
.wewrite .hljs-selector-class,
.wewrite .hljs-selector-attr,
.wewrite .hljs-selector-pseudo,
.wewrite .hljs-number {
	color: var(--code-variable-color, #d19a66)
}

.wewrite .hljs-symbol,
.wewrite .hljs-bullet,
.wewrite .hljs-link,
.wewrite .hljs-meta,
.wewrite .hljs-selector-id,
.wewrite .hljs-title {
	color: var(--code-symbol-color, #61aeee)
}

.wewrite .hljs-built_in,
.wewrite .hljs-title.class_,
.wewrite .hljs-class .wewrite .hljs-title {
	color: var (--code-class-color, #e6c07b)
}

.wewrite .hljs-emphasis {
	font-style: italic
}

.wewrite .hljs-strong {
	font-weight: bold
}

.wewrite .hljs-link {
	text-decoration: underline
}

.wewrite .inline-math{
    display: inline-block;
    padding: 0 0.5rem;
}

.wewrite .block-math {
    display: flex;
    width: 100%;
    overflow: auto;
    padding: 0.5rem;
}

.wewrite .block-math svg {
    width: fit-content;
    margin: auto;
}
:root {
/* 	定义微信公众号文章的一些关键样式变量 */
--wechat-text-color: #333; /* 文字颜色 */
--wechat-text-font-size: 16px; /* 文字大小 */
--wechat-text-letter-space: 0px; /* 字间距大小 */
--wechat-line-height: 1.5; /* 行高 */
--wechat-text-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 字体 */
--wechat-text-font-weight: 400; /* 字体粗细 */
--wechat-text-word-break: break-word; /* 单词换行 */

--wechat-bg-color: #fff; /* 背景颜色 */
--wecchat-border-color: #eaeaea; /* 边框颜色 */
--wechat-link-color: rgb(0, 102, 204); /* 链接颜色 */
--wechat-padding: 1em; /* 内边距 */
--wechat-margin: 0; /* 外边距 */
/*  标题样式 */
--wechat-header-text-color: #333; /* 标题文字颜色 */
/* 脚注样式 */
--wechat-footer-text-color: #999; /* 脚注文字颜色 */
/* 代码块背景颜色 */
--wechat-code-bg-color: #f5f5f5; /* 代码块背景颜色 */
--wechat-code-text-color: #333; /* 代码块文字颜色 */
--wechat-code-font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace; /* 代码块字体 */
--wechat-code-font-size: 14px; /* 代码块文字大小 */
--wechat-code-line-height: 1.5; /* 代码块行高 */
--wechat-code-padding: 0.2em 0.4em; /* 代码块内边距 */
--wechat-code-border-radius: 3px; /* 代码块圆角 */
/* 引用样式 */
--wechat-quote-bg-color: #f5f5f5; /* 引用背景颜色 */
--wechat-quote-text-color: #333; /* 引用文字颜色 */
--wechat-quote-border-color: #eaeaea; /* 引用边框颜色 */
--wechat-quote-border-left-width: 4px; /* 引用边框宽度 */
--wechat-quote-padding: 1em; /* 引用内边距 */
--wechat-quote-font-size: 16px; /* 引用文字大小 */
--wechat-quote-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 引用字体 */
--wechat-quote-border-left: 4px solid var(--wechat-quote-border-color); /* 引用左边框 */

/* 折叠样式 */
--wechat-collapse-bg-color: #f5f5f5; /* 折叠背景颜色 */
--wechat-collapse-text-color: #333; /* 折叠文字颜色 */
--wechat-collapse-border-color: #eaeaea; /* 折叠边框颜色 */
--wechat-collapse-border-radius: 3px; /* 折叠圆角 */
--wechat-collapse-padding: 1em; /* 折叠内边距 */
--wechat-collapse-margin: 0; /* 折叠外边距 */
--wechat-collapse-font-size: 16px; /* 折叠文字大小 */
--wechat-collapse-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 折叠字体 */
--wechat-collapse-border: 1px solid var(--wechat-collapse-border-color); /* 折叠边框 */

/* list样式 */
--wechat-list-text-color: var(--wechat-text-color, #333); /* 列表文字颜色 */
--wechat-list-bg-color: var(--wechat-bg-color,  #fff); /* 列表背景颜色 */
--wechat-list-pading-left: 2rem; /* 列表内边距 */
--wechat-list-margin: 0; /* 列表外边距 */
--wechat-list-margin-top: 0; /* 列表外边距 */
--wechat-list-margin-bottom: 0; /* 列表外边距 */
--wechat-list-marker-color: var(--wechat-text-color, #333); /* 列表标记颜色 */


}


/* table */
.wewrite .table-container {
    display: flex;
    width: 100%;
    overflow: auto;
    padding: 1px;
}

.wewrite table {
    border-collapse: collapse;
    width: fit-content;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    margin: auto;
}

.wewrite thead {
    background: #3eaf7c !important;
    color: #fff;
    text-align: left;
}

.wewrite tr:nth-child(2n) {
    background-color: rgba(62, 175, 124, 0.2);
}

.wewrite th {
    background: #3eaf7c !important;
    color: #fff;
}

.wewrite th,
.wewrite td {
    padding: 12px 7px;
    line-height: 24px;
}

.wewrite td {
    min-width: 120px;
}

.wewrite tr:hover {
    background-color: #f1f1f1;
    /* 行悬停效果 */
}
`;