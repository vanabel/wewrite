"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MathJax = require("src/es5/node-main");
function renderSVG(mathType, mathString) {
    MathJax.init({
        loader: { load: ['input/tex', 'input/asciimath', 'input/mml', 'output/svg'] }
    }).then(function (MathJax) {
        // 你的代码逻辑
        var svg;
        if (mathType == 'tex') {
            svg = MathJax.tex2svg(mathString, { display: true });
            console.log(MathJax.startup.adaptor.outerHTML(svg));
        }
        else if (mathType == 'asciimath') {
            svg = MathJax.asciimath2svg(mathString, { display: true });
            console.log(MathJax.startup.adaptor.outerHTML(svg));
        }
        else if (mathType == 'mathml') {
            svg = MathJax.mathml2svg(mathString, { display: true });
            console.log(MathJax.startup.adaptor.outerHTML(svg));
        }
    }).catch(function (err) {
        console.log(err.message);
    });
}
renderSVG('tex', '\\frac{1}{x^2-1}');
renderSVG('asciimath', '1/x^2-1');
renderSVG('mathml', "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">\n  <mrow>\n    <mi>x</mi>\n    <mo>=</mo>\n    <mfrac>\n      <mrow>\n        <mo>-</mo>\n        <mi>b</mi>\n        <mo>\u00B1</mo>\n        <msqrt>\n          <mrow>\n            <msup><mi>b</mi><mn>2</mn></msup>\n            <mo>-</mo>\n            <mn>4</mn>\n            <mi>a</mi>\n            <mi>c</mi>\n          </mrow>\n        </msqrt>\n      </mrow>\n      <mrow>\n        <mn>2</mn>\n        <mi>a</mi>\n      </mrow>\n    </mfrac>\n  </mrow>\n</math>");
