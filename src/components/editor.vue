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
        <div class="bdedit_loadingOverlay" :class="{ active: (loading || parentLoading) }">
            <div class="bdedit_loadingSpinner" />
        </div>
        <div class="bdedit_sidebar">
            <div class="bdedit_explorer">
                <div class="bdedit_sidebarItem bdedit_sidebarTitle">Explorer</div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile"
                     v-for="file in hoistedFiles"
                     :class="{active: activeFn && activeFn.name === file.name, bdedit_notsaved: !file.saved}"
                     @click="() => sidebarItemClicked(file)">{{file.caption || file.name}}</div>
                <div class="bdedit_sidebarItem bdedit_sidebarHeader"><span>Files</span> <button @click="_newFile">+</button></div>

                <template v-for="file in normalFiles">
                    <div v-if="ctxAct && ctxAct.action === 'rename' && ctxAct.item.name === file.name" class="bdedit_inputWrapper">
                        <input type="text" @click.stop @keydown.enter="e => renameFile(e, file)" @keydown.esc="ctxAct = undefined" ref="renameInput" :value="file.name" />
                    </div>
                    <div v-else class="bdedit_sidebarItem bdedit_sidebarFile"
                         :class="{active: activeFn && activeFn.name === file.name, bdedit_notsaved: !file.saved}"
                         @click="() => sidebarItemClicked(file)"
                         @contextmenu="e => contextMenu(e, file)">{{file.caption || file.name}}</div>
                </template>

                <div v-if="cnf" class="bdedit_inputWrapper">
                    <input type="text" @keydown.enter="createNewFile" @keydown.esc="cnf = false" ref="newFileInput" />
                </div>

                <div class="bdedit_sidebarItem bdedit_sidebarHeader"><span>Snippets</span> <button @click="_newSnippet">+</button></div>
                <div class="bdedit_sidebarItem bdedit_sidebarFile"
                     v-for="snippet in snippets"
                     :class="{active: activeFn && activeFn.name === snippet.name, bdedit_notsaved: !snippet.saved}"
                     @click="() => sidebarItemClicked(snippet)">{{snippet.caption || snippet.name}}</div>

                <div v-if="cns" class="bdedit_inputWrapper">
                    <input type="text" @keydown.enter="createNewSnippet" @keydown.esc="cns = false" ref="newSnippetInput" />
                </div>
            </div>

            <div class="bdedit_extras">
                <div class="bdedit_extra" @click="() => editor.showSettingsMenu()">Settings</div>
                <div class="bdedit_extra" @click="() => editor.showKeyboardShortcuts()">Keybinds</div>
            </div>
        </div>
        <div class="bdedit_editorOuterWrapper">

            <div class="bdedit_tabs">
                <div class="bdedit_headerbtn bdedit_btnsave" @click="_save"><span>Save</span></div>
                <div v-if="activeFn && (activeFn.mode === 'js' || activeFn.mode === 'javascript')" class="bdedit_headerbtn bdedit_btnrun" @click="_runScript"><span>Run</span> <span class="bdedit_runsvg" /></div>
                <div v-if="activeFn && (activeFn.mode === 'css' || activeFn.mode === 'scss')" class="bdedit_headerbtn bdedit_btnsave" @click="_inject"><span>Inject</span></div>
                <div class="bdedit_toggleWrapper" :class="{ active: activeFn.liveUpdateEnabled }" v-if="activeFn && (activeFn.liveUpdate)" @click="_toggleLiveUpdate">
                    <span>Live Update</span>
                    <div class="bdedit_toggle" />
                </div>
            </div>
            <div class="bdedit_disc" v-if="activeFn && activeFn.changed">
                <span>Contents of this file have changed on disk.</span>
                <div class="bdedit_headerbtn" @click="() => sidebarItemClicked(activeFn, true)">Reload</div>
            </div>

            <div class="bdedit_editorWrapper">
                <div class="bdedit_editor" ref="editor" />
                <div class="bdedit_errorConsole" :class="{ active: error }">
                    <div class="bdedit_errorMsg">{{error}}</div>
                </div>
            </div>
        </div>
        <div v-if="ctxMenu" class="bdedit_ctxMenu" :style="{ 'left': `${ctxMenu.x}px`, 'top': `${ctxMenu.y}` }">
            <ul>
                <li @click.stop="() => _ctxAction('reveal')">Reveal in Explorer</li>
                <li @click.stop="() => _ctxAction('copy')">Copy</li>
                <li @click.stop="() => _ctxAction('copyPath')">Copy Path</li>
                <li @click.stop="() => _ctxAction('rename')">Rename</li>
                <li @click.stop="() => _ctxAction('delete')">Delete</li>
            </ul>
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

            'runScript',
            'updateContent',
            'saveSnippet',
            'saveFile',
            'newFile',
            'newSnippet',
            'readFile',
            'readSnippet',
            'injectStyle',
            'toggleLiveUpdate',
            'parentLoading',

            'ctxAction'
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
                'cns': false,
                'activeFn': undefined,
                'loading': true,
                'ctxMenu': undefined,
                'ctxAct': undefined
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

            ace.config.loadModule('ace/ext/settings_menu', module => { module.init(this.editor) });
            ace.config.loadModule("ace/ext/keybinding_menu", module => { module.init(this.editor) });
            window._editor = this.editor;

            document.body.addEventListener('keydown', e => {
                this.ctxMenu = undefined
                if ((e.ctrlKey || e.metaKey) && e.which === 82) {
                    e.preventDefault();
                    e.stopPropagation();
                    const mode = this.activeFn.mode;

                    if (mode === 'js' || mode === 'javascript') return this._runScript();
                    if (mode === 'css' || mode === 'scss') return this._inject();

                    return;
                }

                if ((e.ctrlKey || e.metaKey) && e.which === 83) {
                    this._save();
                    return;
                }

                if ((e.ctrlKey || e.metaKey) && e.which === 116) {
                    document.location.reload();
                }

            });
            window.addEventListener('click', e => {
                this.ctxMenu = undefined;
                this.ctxAct = undefined;
            });

            this.loading = false;
            this.loadInitialFile();
        },
        methods: {
            session() {
                return this.editor.getSession();
            },

            loadInitialFile() {
                if (this.loading || this.parentLoading) {
                    return setTimeout(this.loadInitialFile, 100);
                }
                if (this.files.length <= 0) return;

                if (this.files.length === 1) {
                    this.sidebarItemClicked(this.files[0]);
                    return;
                }

                const activeFile = this.files.find(f => f.hoisted === true);
                if (activeFile) {
                    this.sidebarItemClicked(activeFile);
                    return;
                }

                this.sidebarItemClicked(this.files[0]);
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
                if (mode === 'js') mode = 'javascript';
                this.session().setMode(`ace/mode/${mode}`);
            },

            setValue(value) {
                this.editor.setValue(value, 1);
            },

            getValue() {
                return this.editor.getValue();
            },

            async sidebarItemClicked(item, forceReload = false) {
                console.log(`Loading ${item.type}`, item);
                let content = item.content;
                if (!item.read || forceReload) {
                    this.loading = true;
                    content = item.type === 'file' ? await this.readFile(item) : await this.readSnippet(item);
                }
                this.loading = false;
                this.swc = true;
                this.setMode(item.mode);
                this.setValue(content);
                this.editor.setOptions(editorOptions);
                this.activeFn = item;
                this.swc = false;
                this.editor.focus();
            },

            ionChange(e, s) {
                this.error = undefined;
                if (!this.swc && this.activeFn !== undefined) this.updateContent(this.activeFn, this.getValue());
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

            async _runScript() {
                const result = await this.runScript(this.getValue());
                if (result.err) {
                    console.log('runscript error: ', result.err);
                    this.setError(result.err);
                }
            },

            async _inject() {
                const result = await this.injectStyle(this.activeFn);
                if (result.err) {
                    console.log('inject error: ', result.err);
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
                if (!target.value || target.value.length <= 0) {
                    this.cnf = false;
                    return;
                }
                const nf = this.newFile(target.value);
                this.cnf = false;
                this.$nextTick(() => this.sidebarItemClicked(nf));
            },

            createNewSnippet(e) {
                const { target } = e;
                if (!target.value || target.value.length <= 0) {
                    this.cns = false;
                    return;
                }
                const ns = this.newSnippet(target.value);
                this.cns = false;
                this.$nextTick(() => this.sidebarItemClicked(ns));
            },

            _toggleLiveUpdate() {
                this.activeFn = this.toggleLiveUpdate(this.activeFn);
                this.$forceUpdate();
            },

            contextMenu(e, item) {
                this.ctxMenu = {
                    x: e.clientX,
                    y: e.clientY,
                    item
                };
            },

            _ctxAction(action) {
                this.ctxAct = {
                    item: this.ctxMenu.item,
                    action
                };
                this.ctxMenu = undefined;

                if (action === 'rename') {
                    this.$nextTick(() => {
                        const renameInput = this.$refs.renameInput[0];
                        renameInput.setSelectionRange(0, renameInput.value.split('.')[0].length);
                        renameInput.focus();
                    });
                    return;
                }

                this.ctxAction(action, this.ctxAct.item);
                this.ctxAct = undefined;
            },

            renameFile(e, file) {
                console.log('oldname:newname', file.name, e.target.value);
                this.ctxAct = undefined;
            }

        },
        watch: {
            error() {
                this.$nextTick(() => this.editor.resize());
            }
        },
        computed: {
            hoistedFiles() {
                return this.files.filter(file => file.hoisted);
            },
            normalFiles() {
                return this.files.filter(file => !file.hoisted);
            }
        }
    }
</script>
