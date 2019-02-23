/**
 * BetterDiscord Installer
 * Copyright (c) 2018-present Jiiks/JsSucks - https://github.com/Jiiks / https://github.com/JsSucks
 * All rights reserved.
 * https://betterdiscord.net
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

<template>
    <div class="bdedit_container" @click="hideDds">
        <div class="bdedit_sidebar">
            <div class="bdedit_explorer">
                <div class="bdedit_sidebarItem bdedit_sidebarTitle">Explorer</div>
                <div class="bdedit_sidebarItem bdedit_sidebarHeader">Files</div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile" :class="{active: activeFn === file}" v-for="file in files" @click="() => sidebarItemClicked(file)">{{file}}</div>
                <div class="bdedit_sidebarItem bdedit_sidebarHeader">Snippets</div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile" :class="{active: activeFn === file}" v-for="file in snippets" @click="() => sidebarItemClicked(file)">{{file}}</div>
            </div>
            <div class="bdedit_themeChooser">
                <span>Theme: </span>
                <div class="bdedit_dropdown" :class="{active: themeddactive}" @click.stop="toggleThemeDd">
                    <span class="bdedit_dropdownSelected">{{currentTheme.caption}}</span>
                    <div class="bdedit_dropdownInner" ref="themedd">
                        <div class="bdedit_dropdownItem" :class="{active: theme.caption === currentTheme.caption}" v-for="theme in themelist().themes" @click.stop="selectTheme(theme)">{{theme.caption}}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bdedit_editorOuterWrapper">
            <div class="bdedit_tabs">
                <div class="bdedit_headerbtn bdedit_btnrun" @click="_runScript"><span>Run</span> <span class="bdedit_runsvg" /></div>
            </div>
            <div class="bdedit_editorWrapper">
                <div class="bdedit_editor" ref="editor" />
            </div>
        </div>
    </div>
</template>

<script>
    import styles from '../styles/index.scss';
    import { ace, mode_js, mode_css, theme_default, language_tools } from '../ace.js';
    const tl = require('brace/ext/themelist');

    const editorOptions = {
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true
    }

    export default {
        props: [
            'files',
            'snippets',
            'fileInfo',
            'activeFn',

            'runScript',
            'saveSnippet',
            'saveFile',
            'newFile',
            'newSnippet'
        ],
        data() {
            return {
                'editor': null,
                'themeddactive': false,
                'currentTheme': {
                    caption: 'Merbivore Soft'
                }
            }
        },
        mounted() {
            console.log('[BDEdit] Mounted');
            const style = document.createElement('style');
            style.append(document.createTextNode(styles));
            document.head.append(style);

            this.editor = ace.edit(this.$refs.editor);
            this.editor.$blockScrolling = Infinity;
            this.editor.setOptions(editorOptions);
            this.setTheme('merbivore_soft');
            this.setMode('css');
            this.session().on('change', this.ionChange);
        },
        methods: {
            session() {
                return this.editor.getSession();
            },

            setTheme(theme) {
                this.editor.setTheme(`ace/theme/${theme}`);
            },

            setThemeAbs(theme) {
                this.editor.setTheme(theme);
            },

            selectTheme(theme) {
                this.currentTheme = theme;
                this.themeddactive = false;
                this.setThemeAbs(theme.theme);
            },

            setMode(mode) {
                this.session().setMode(`ace/mode/${mode}`);
            },

            setValue(value) {
                this.editor.setValue(value, 1);
            },

            getValue() {
                return this.editor.getValue();
            },

            sidebarItemClicked(item) {
                const fi = this.fileInfo(item);
                this.setMode(fi.mode);
                this.setValue(fi.value);
                this.activeFn = item;
            },

            ionChange(e, s) {
                let t = document.getElementById('test');
                if (!t) {
                    const nt = Object.assign(document.createElement('style'), { id: 'test' });
                    t = nt;
                    document.head.append(nt);
                }
                t.innerHTML = '';
                t.appendChild(document.createTextNode(this.getValue()));
            },

            themelist() {
                return ace.acequire("ace/ext/themelist");
            },

            toggleThemeDd() {
                this.themeddactive = !this.themeddactive;
                setTimeout(() => this.$refs.themedd.querySelector('.active').scrollIntoView());
            },

            hideDds() {
                this.themeddactive = false;
            },

            _runScript() {
                const result = this.runScript(this.getValue());
                if (result.err) {
                    // TODO Display error
                    console.log('runscript error: ', result.err);
                }
            }
        }
    }
</script>
