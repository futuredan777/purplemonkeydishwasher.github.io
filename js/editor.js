/**
 * CMS — WYSIWYG Editor
 * Rich text editor using contenteditable + execCommand.
 * Falls back gracefully in all modern browsers.
 */

class Editor {
  constructor(containerEl, opts = {}) {
    this.container = containerEl;
    this.opts = {
      placeholder: 'Start writing your post…',
      onChange: null,
      ...opts,
    };
    this.savedRange = null;
    this._build();
    this._bindToolbar();
    this._bindContent();
  }

  // ---- Build HTML -------------------------------------------------------

  _build() {
    this.container.innerHTML = `
      <div class="editor-toolbar" id="editor-toolbar">
        <!-- Block format -->
        <div class="toolbar-group">
          <select class="toolbar-select" id="tb-format" title="Paragraph style">
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="pre">Code block</option>
          </select>
        </div>
        <div class="toolbar-sep"></div>

        <!-- Inline formatting -->
        <div class="toolbar-group">
          <button class="toolbar-btn" data-cmd="bold"          title="Bold (Ctrl+B)"><b>B</b></button>
          <button class="toolbar-btn" data-cmd="italic"        title="Italic (Ctrl+I)"><i>I</i></button>
          <button class="toolbar-btn" data-cmd="underline"     title="Underline (Ctrl+U)"><u>U</u></button>
          <button class="toolbar-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        </div>
        <div class="toolbar-sep"></div>

        <!-- Lists -->
        <div class="toolbar-group">
          <button class="toolbar-btn" data-cmd="insertUnorderedList" title="Bullet list">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="insertOrderedList" title="Numbered list">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="outdent" title="Outdent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="3" y2="12"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="indent" title="Indent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 8 21 12 17 16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
        </div>
        <div class="toolbar-sep"></div>

        <!-- Alignment -->
        <div class="toolbar-group">
          <button class="toolbar-btn" data-cmd="justifyLeft"   title="Align left">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="justifyCenter" title="Center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="justifyRight"  title="Align right">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </button>
        </div>
        <div class="toolbar-sep"></div>

        <!-- Extras -->
        <div class="toolbar-group">
          <button class="toolbar-btn" data-cmd="createLink" title="Insert link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="unlink" title="Remove link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.84 12.25l1.72-1.71a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M5.17 11.75l-1.72 1.71a5 5 0 007.07 7.07l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="insertHorizontalRule" title="Horizontal rule">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="blockquote" title="Blockquote">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 3-1 4-2 5"/><path d="M13 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 3-1 4-2 5"/></svg>
          </button>
        </div>
        <div class="toolbar-sep"></div>

        <!-- History -->
        <div class="toolbar-group">
          <button class="toolbar-btn" data-cmd="undo" title="Undo (Ctrl+Z)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>
          </button>
          <button class="toolbar-btn" data-cmd="redo" title="Redo (Ctrl+Y)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.45"/></svg>
          </button>
        </div>

        <!-- HTML source toggle -->
        <div class="toolbar-group" style="margin-left:auto">
          <button class="toolbar-btn" id="tb-source" title="Toggle HTML source">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </button>
        </div>
      </div>

      <div class="editor-body">
        <div
          class="editor-content"
          id="editor-content"
          contenteditable="true"
          data-placeholder="${this.opts.placeholder}"
          spellcheck="true"
        ></div>
        <textarea
          class="editor-source"
          id="editor-source"
          style="display:none;width:100%;height:100%;min-height:400px;padding:1.5rem;font-family:var(--font-mono);font-size:0.8125rem;line-height:1.6;resize:none;border:none;outline:none;background:hsl(var(--muted));color:hsl(var(--foreground));"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="editor-footer">
        <span id="editor-word-count">0 words</span>
        <span id="editor-char-count">0 characters</span>
      </div>
    `;

    this.content  = this.container.querySelector('#editor-content');
    this.source   = this.container.querySelector('#editor-source');
    this.toolbar  = this.container.querySelector('#editor-toolbar');
    this.wc       = this.container.querySelector('#editor-word-count');
    this.cc       = this.container.querySelector('#editor-char-count');
    this.srcBtn   = this.container.querySelector('#tb-source');
    this.sourceMode = false;
  }

  // ---- Toolbar bindings -------------------------------------------------

  _bindToolbar() {
    // Format select
    this.container.querySelector('#tb-format').addEventListener('change', e => {
      const val = e.target.value;
      if (val === 'pre') {
        document.execCommand('formatBlock', false, 'pre');
      } else {
        document.execCommand('formatBlock', false, val);
      }
      this.content.focus();
    });

    // Buttons
    this.toolbar.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevent blur
        const cmd = btn.dataset.cmd;
        this._execCmd(cmd);
      });
    });

    // Source toggle
    this.srcBtn.addEventListener('click', () => this._toggleSource());

    // Update button states on selection change
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.content) this._updateToolbarState();
    });
  }

  _execCmd(cmd) {
    if (this.sourceMode) return;
    this.content.focus();
    switch (cmd) {
      case 'createLink': {
        const sel = window.getSelection();
        const url = prompt('Enter URL:', sel && sel.toString().startsWith('http') ? sel.toString() : 'https://');
        if (url) document.execCommand('createLink', false, url);
        break;
      }
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      default:
        document.execCommand(cmd, false, null);
    }
    this._updateWordCount();
    this.opts.onChange && this.opts.onChange(this.getHTML());
  }

  _updateToolbarState() {
    const cmds = ['bold', 'italic', 'underline', 'strikeThrough',
                  'insertUnorderedList', 'insertOrderedList',
                  'justifyLeft', 'justifyCenter', 'justifyRight'];
    cmds.forEach(cmd => {
      const btn = this.toolbar.querySelector(`[data-cmd="${cmd}"]`);
      if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
    });

    // Update format select
    const block = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '');
    const sel = this.toolbar.querySelector('#tb-format');
    if (sel && block) {
      const opt = sel.querySelector(`option[value="${block}"]`);
      if (opt) sel.value = block;
    }
  }

  // ---- Content bindings -------------------------------------------------

  _bindContent() {
    const update = debounce(() => {
      this._updateWordCount();
      this.opts.onChange && this.opts.onChange(this.getHTML());
    }, 300);

    this.content.addEventListener('input', update);
    this.content.addEventListener('paste', e => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, text);
    });
    this.content.addEventListener('keydown', e => {
      // Tab key → indent
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
      }
    });
  }

  // ---- Source toggle ----------------------------------------------------

  _toggleSource() {
    this.sourceMode = !this.sourceMode;
    this.srcBtn.classList.toggle('active', this.sourceMode);

    if (this.sourceMode) {
      this.source.value = this.content.innerHTML;
      this.content.style.display = 'none';
      this.source.style.display = 'block';
      this.source.focus();
      this.source.addEventListener('input', () => {
        this.opts.onChange && this.opts.onChange(this.source.value);
      });
    } else {
      this.content.innerHTML = this.source.value;
      this.source.style.display = 'none';
      this.content.style.display = 'block';
      this.content.focus();
      this._updateWordCount();
      this.opts.onChange && this.opts.onChange(this.getHTML());
    }
  }

  // ---- Word count -------------------------------------------------------

  _updateWordCount() {
    const html = this.content.innerHTML;
    const wc   = wordCount(html);
    const cc   = charCount(html);
    this.wc.textContent = `${wc} word${wc !== 1 ? 's' : ''}`;
    this.cc.textContent = `${cc} character${cc !== 1 ? 's' : ''}`;
  }

  // ---- Public API -------------------------------------------------------

  getHTML() {
    return this.sourceMode ? this.source.value : this.content.innerHTML;
  }

  setHTML(html) {
    this.content.innerHTML = html || '';
    if (this.sourceMode) this.source.value = html || '';
    this._updateWordCount();
  }

  focus() { this.content.focus(); }

  clear() { this.setHTML(''); }
}

window.Editor = Editor;
