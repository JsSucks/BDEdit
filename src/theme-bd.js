/* global ace */

const style = require('./theme-bd.scss');

ace.define('ace/theme/betterdiscord', ['require', 'exports', 'module', 'ace/lib/dom'], function (require, exports, module) {
    exports.isDark = true;
    exports.cssClass = 'ace-betterdiscord';
    exports.cssText = style;

    const dom = require('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
});

(function () {
    ace.require(['ace/theme/betterdiscord'], function (m) {
        if (typeof module === 'object' && typeof exports === 'object' && module) {
            module.exports = m;
        }
    });
})();
