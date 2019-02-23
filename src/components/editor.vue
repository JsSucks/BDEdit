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
                <div class="bdedit_sidebarItem bdedit_sidebarHeader"><span>Files</span> <button @click="_newFile">+</button></div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile"
                     v-for="file in files"
                     :class="{active: activeFn && activeFn.name === file.name, bdedit_notsaved: !file.saved}"
                     @click="() => sidebarItemClicked(file)">{{file.name}}</div>
                <div v-if="cnf" class="bdedit_inputWrapper">
                    <input type="text" @keydown.enter="createNewFile" ref="newFileInput" />
                </div>
                <div class="bdedit_sidebarItem bdedit_sidebarHeader"><span>Snippets</span> <button @click="_newSnippet">+</button></div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile"
                     v-for="snippet in snippets"
                     :class="{active: activeFn && activeFn.name === snippet.name, bdedit_notsaved: !snippet.saved}"
                     @click="() => sidebarItemClicked(snippet)">{{snippet.name}}</div>
                <div v-if="cns" class="bdedit_inputWrapper">
                    <input type="text" @keydown.enter="createNewSnippet" ref="newSnippetInput" />
                </div>
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
                <div class="bdedit_headerbtn bdedit_btnsave" @click="_save"><span>Save</span></div>
                <div class="bdedit_headerbtn bdedit_btnrun" @click="_runScript"><span>Run</span> <span class="bdedit_runsvg" /></div>
            </div>

            <div class="bdedit_editorWrapper">
                <div class="bdedit_editor" ref="editor" />
                <div class="bdedit_errorConsole" :class="{ active: error }">
                    <div class="bdedit_errorMsg">{{error}}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import styles from '../styles/index.scss';
    import '../ace';

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
            'updateContent',
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
                },
                'swc': false,
                'error': undefined,
                'cnf': false,
                'cns': false
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
            this.setMode('scss');
            this.session().on('change', this.ionChange);
        },
        methods: {
            session() {
                return this.editor.getSession();
            },

            setError(err) {
                this.error = err;
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
                this.swc = true;
                console.log('Loading file/snippet', item);
                this.setMode(item.mode);
                this.setValue(item.content);
                this.editor.setOptions(editorOptions);
                this.activeFn = item;
                this.swc = false;
                this.editor.focus();
            },

            ionChange(e, s) {
                if(!this.swc && this.activeFn !== undefined) this.updateContent(this.activeFn, this.getValue());
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

            _save() {
                if (this.activeFn === undefined) return;
                if (this.activeFn.type === 'file') return this.saveFile(this.activeFn);
                if (this.activeFn.type === 'snippet') return this.saveSnippet(this.activeFn);
            },

            _runScript() {
                const result = this.runScript(this.getValue());
                if (result.err) {
                    console.log('runscript error: ', result.err);
                    this.setError(result.err);
                }
            },

            _newFile() {
                this.cnf = true;
                this.$nextTick(() => this.$refs.newFileInput.focus());
            },

            _newSnippet() {
                this.cns = true;
                this.$nextTick(() => this.$refs.newSnippetInput.focus());
            },

            createNewFile(e) {
                const { target } = e;
                const nf = this.newFile(target.value);
                this.cnf = false;
                this.$nextTick(() => this.sidebarItemClicked(nf));
            },

            createNewSnippet(e) {
                const { target } = e;
                const ns = this.newSnippet(target.value);
                this.cns = false;
                this.$nextTick(() => this.sidebarItemClicked(ns));
            }

        },
        watch: {
            error() {
                this.$nextTick(() => this.editor.resize());
            }
        }
    }
</script>
