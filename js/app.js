/**
 * CMS — App
 * Router, view management, and global shell rendering.
 */

class CMS {
  constructor() {
    this.currentView = null;
    this.activeEditor = null;
    this.activePostId = null;
    this._pendingChanges = false;
  }

  // ---- Init -------------------------------------------------------------

  init() {
    Theme.init();
    this._renderShell();
    initDropdowns();
    this._route();
    window.addEventListener('hashchange', () => this._route());
  }

  // ---- Shell ------------------------------------------------------------

  _renderShell() {
    document.body.innerHTML = `
      <div class="app-shell">
        ${this._sidebarHtml()}
        <header class="topbar">
          <div class="topbar-breadcrumb" id="topbar-breadcrumb">
            <span class="crumb">CMS</span>
          </div>
          <div class="topbar-actions">
            <button class="btn btn-ghost btn-icon" id="theme-toggle" data-tooltip="Toggle theme" aria-label="Toggle theme">
              <span data-theme-icon style="width:1rem;height:1rem;display:flex;align-items:center;justify-content:center;"></span>
            </button>
            <div class="dropdown">
              <button class="btn btn-ghost btn-icon" data-dropdown-trigger="user-menu" aria-label="User menu">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
              </button>
              <div class="dropdown-menu" id="user-menu">
                <div class="dropdown-label" id="user-menu-name">Admin</div>
                <div class="dropdown-separator"></div>
                <button class="dropdown-item" onclick="CMS.navigate('#/settings')">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
                  Settings
                </button>
              </div>
            </div>
          </div>
        </header>
        <main class="main-content" id="main-content">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:hsl(var(--muted-foreground));">Loading…</div>
        </main>
      </div>
      <div id="toast-container"></div>
    `;

    document.getElementById('theme-toggle').addEventListener('click', () => Theme.toggle());
    Theme.init(); // re-apply icons now DOM is ready

    // Update user menu name
    const s = Store.getSettings();
    const el = document.getElementById('user-menu-name');
    if (el) el.textContent = s.author || 'Admin';
  }

  _sidebarHtml() {
    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">C</div>
          <div>
            <div class="sidebar-brand">CMS</div>
            <div class="sidebar-version">v1.0</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Content</div>
          <button class="nav-item" data-nav="dashboard" onclick="CMS.navigate('#/')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>
          <button class="nav-item" data-nav="posts" onclick="CMS.navigate('#/posts')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Posts
            <span class="nav-badge" id="nav-draft-count"></span>
          </button>
          <button class="nav-item" data-nav="new-post" onclick="CMS.navigate('#/new')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Post
          </button>
          <div class="sidebar-section-label" style="margin-top:0.75rem">Manage</div>
          <button class="nav-item" data-nav="media" onclick="CMS.navigate('#/media')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Media
          </button>
          <button class="nav-item" data-nav="settings" onclick="CMS.navigate('#/settings')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
            Settings
          </button>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user-avatar" id="sidebar-avatar">A</div>
          <div>
            <div class="sidebar-user-name" id="sidebar-username">Admin</div>
            <div class="sidebar-user-role">Administrator</div>
          </div>
        </div>
      </aside>
    `;
  }

  // ---- Router -----------------------------------------------------------

  _route() {
    const hash = location.hash || '#/';
    const [path, ...rest] = hash.replace('#', '').split('/').filter(Boolean);

    this._updateNav(path || '');

    if (!path || path === '') {
      this._renderDashboard();
    } else if (path === 'posts') {
      this._renderPostList();
    } else if (path === 'new') {
      this._renderEditor(null);
    } else if (path === 'edit') {
      this._renderEditor(rest[0]);
    } else if (path === 'media') {
      this._renderMedia();
    } else if (path === 'settings') {
      this._renderSettings();
    } else {
      this._renderDashboard();
    }

    this._updateDraftBadge();
    this._updateSidebarUser();
  }

  _updateNav(path) {
    document.querySelectorAll('.nav-item[data-nav]').forEach(el => {
      el.classList.remove('active');
    });
    const map = {
      '': 'dashboard',
      'posts': 'posts',
      'new': 'new-post',
      'edit': 'posts',
      'media': 'media',
      'settings': 'settings',
    };
    const key = map[path] || path;
    const target = document.querySelector(`.nav-item[data-nav="${key}"]`);
    if (target) target.classList.add('active');
  }

  _updateDraftBadge() {
    const el = document.getElementById('nav-draft-count');
    if (!el) return;
    const n = Store.getStats().draft;
    el.textContent = n > 0 ? n : '';
    el.style.display = n > 0 ? '' : 'none';
  }

  _updateSidebarUser() {
    const s = Store.getSettings();
    const avatar = document.getElementById('sidebar-avatar');
    const name = document.getElementById('sidebar-username');
    if (avatar) avatar.textContent = (s.author || 'A').charAt(0).toUpperCase();
    if (name) name.textContent = s.author || 'Admin';
  }

  _setBreadcrumb(parts) {
    const el = document.getElementById('topbar-breadcrumb');
    if (!el) return;
    el.innerHTML = ['CMS', ...parts]
      .map((p, i) => `<span class="${i === parts.length ? 'crumb' : ''}">${escapeHtml(p)}</span>`)
      .join(`<span class="sep">/</span>`);
  }

  // ---- Dashboard --------------------------------------------------------

  _renderDashboard() {
    this._setBreadcrumb(['Dashboard']);
    const stats = Store.getStats();
    const posts = Store.getPosts().slice(0, 5);
    const s = Store.getSettings();

    this._setContent(`
      <div class="page">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-title">Dashboard</h1>
            <p class="page-description">Welcome back, ${escapeHtml(s.author || 'Admin')}. Here's what's happening.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="CMS.navigate('#/new')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Post
            </button>
          </div>
        </div>

        <div class="grid-4" style="margin-bottom:1.5rem">
          <div class="stat-card">
            <div class="stat-label">Total Posts</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Published</div>
            <div class="stat-value">${stats.published}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Drafts</div>
            <div class="stat-value">${stats.draft}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Scheduled</div>
            <div class="stat-value">${stats.scheduled}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Recent Posts</div>
            <div class="card-description">Your latest content</div>
          </div>
          <div class="card-body" style="padding-top:0.5rem">
            ${posts.length === 0
              ? `<div class="empty-state"><div class="empty-state-title">No posts yet</div><div class="empty-state-description">Create your first post to get started.</div></div>`
              : posts.map(p => `
              <div style="display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0;border-bottom:1px solid hsl(var(--border))">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:500;font-size:0.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(p.title || 'Untitled')}</div>
                  <div style="font-size:0.75rem;color:hsl(var(--muted-foreground));margin-top:0.125rem">${Store.relativeTime(p.updatedAt)} · ${escapeHtml(p.category || 'General')}</div>
                </div>
                <span class="badge ${p.status === 'published' ? 'badge-success' : p.status === 'scheduled' ? 'badge-warning' : 'badge-secondary'}">${p.status}</span>
                <button class="btn btn-ghost btn-sm" onclick="CMS.navigate('#/edit/${p.id}')">Edit</button>
              </div>`).join('')}
          </div>
          ${posts.length > 0 ? `<div class="card-footer"><button class="btn btn-outline btn-sm" onclick="CMS.navigate('#/posts')">View all posts</button></div>` : ''}
        </div>
      </div>
    `);
  }

  // ---- Post List --------------------------------------------------------

  _renderPostList() {
    this._setBreadcrumb(['Posts']);
    this._setContent(this._postListHtml());
    this._bindPostListEvents();
  }

  _postListHtml(filter = { status: 'all', search: '' }) {
    let posts = Store.getPosts();
    if (filter.status !== 'all') posts = posts.filter(p => p.status === filter.status);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      posts = posts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    const stats = Store.getStats();

    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-title">Posts</h1>
            <p class="page-description">${Store.getStats().total} posts total</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="CMS.navigate('#/new')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Post
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap">
          <div class="tabs" style="flex:1">
            <div class="tabs-list" id="status-filter-tabs">
              ${['all', 'published', 'draft', 'scheduled'].map(s =>
                `<button class="tabs-trigger${filter.status === s ? ' active' : ''}" data-status="${s}">
                  ${s.charAt(0).toUpperCase() + s.slice(1)}
                  <span style="opacity:0.6;font-size:0.75rem;margin-left:0.25rem">${s === 'all' ? stats.total : stats[s] || 0}</span>
                </button>`
              ).join('')}
            </div>
          </div>
          <div style="position:relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:0.625rem;top:50%;transform:translateY(-50%);width:0.875rem;height:0.875rem;color:hsl(var(--muted-foreground));pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="input" id="post-search" type="search" placeholder="Search posts…" value="${escapeHtml(filter.search)}" style="padding-left:2rem;width:200px">
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th>Read time</th>
                <th style="width:1px"></th>
              </tr>
            </thead>
            <tbody>
              ${posts.length === 0
                ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-title">No posts found</div></div></td></tr>`
                : posts.map(p => `
                <tr>
                  <td>
                    <div style="font-weight:500">${escapeHtml(p.title || '(Untitled)')}</div>
                    <div style="font-size:0.75rem;color:hsl(var(--muted-foreground));margin-top:0.125rem;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(p.excerpt || '')}</div>
                  </td>
                  <td><span class="badge ${p.status === 'published' ? 'badge-success' : p.status === 'scheduled' ? 'badge-warning' : 'badge-secondary'}">${p.status}</span></td>
                  <td style="color:hsl(var(--muted-foreground))">${escapeHtml(p.category || '—')}</td>
                  <td style="color:hsl(var(--muted-foreground));white-space:nowrap">${Store.relativeTime(p.updatedAt)}</td>
                  <td style="color:hsl(var(--muted-foreground))">${p.readTime || 1} min</td>
                  <td>
                    <div style="display:flex;gap:0.25rem;justify-content:flex-end">
                      <button class="btn btn-ghost btn-sm" onclick="CMS.navigate('#/edit/${p.id}')">Edit</button>
                      <div class="dropdown">
                        <button class="btn btn-ghost btn-sm btn-icon" data-dropdown-trigger="post-menu-${p.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                        <div class="dropdown-menu" id="post-menu-${p.id}">
                          <button class="dropdown-item" onclick="CMS.app._duplicatePost('${p.id}')">Duplicate</button>
                          ${p.status !== 'published'
                            ? `<button class="dropdown-item" onclick="CMS.app._quickPublish('${p.id}')">Publish</button>`
                            : `<button class="dropdown-item" onclick="CMS.app._quickUnpublish('${p.id}')">Unpublish</button>`}
                          <div class="dropdown-separator"></div>
                          <button class="dropdown-item destructive" onclick="CMS.app._deletePost('${p.id}')">Delete</button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  _bindPostListEvents() {
    let currentFilter = { status: 'all', search: '' };

    const refresh = () => {
      document.getElementById('main-content').innerHTML = this._postListHtml(currentFilter);
      this._bindPostListEvents();
    };

    // Status filter tabs
    document.querySelectorAll('#status-filter-tabs .tabs-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter.status = btn.dataset.status;
        refresh();
      });
    });

    // Search
    const searchInput = document.getElementById('post-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        currentFilter.search = searchInput.value;
        refresh();
      }, 300));
    }
  }

  async _duplicatePost(id) {
    const p = Store.duplicatePost(id);
    Toast.success('Post duplicated');
    CMS.navigate(`#/edit/${p.id}`);
  }

  async _quickPublish(id) {
    Store.updatePost(id, { status: 'published' });
    Toast.success('Post published');
    this._renderPostList();
    this._updateDraftBadge();
  }

  async _quickUnpublish(id) {
    Store.updatePost(id, { status: 'draft' });
    Toast.success('Post moved to drafts');
    this._renderPostList();
    this._updateDraftBadge();
  }

  async _deletePost(id) {
    const ok = await Dialog.confirm({
      title: 'Delete post',
      description: 'This action cannot be undone. The post will be permanently deleted.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    Store.deletePost(id);
    Toast.success('Post deleted');
    this._renderPostList();
    this._updateDraftBadge();
  }

  // ---- Editor -----------------------------------------------------------

  _renderEditor(postId) {
    this.activePostId = postId || null;
    const post = postId ? Store.getPost(postId) : null;

    this._setBreadcrumb(['Posts', postId ? (post?.title || 'Untitled') : 'New Post']);
    this._pendingChanges = false;

    this._setContent(`
      <div class="editor-layout">
        <div class="editor-main">
          <!-- Post title -->
          <div style="padding:1rem 2.5rem 0;border-bottom:1px solid hsl(var(--border))">
            <input
              class="input"
              id="post-title"
              type="text"
              placeholder="Post title…"
              value="${escapeHtml(post?.title || '')}"
              style="border:none;font-size:1.5rem;font-weight:700;padding:0.5rem 0;height:auto;letter-spacing:-0.02em;background:transparent;width:100%"
              autocomplete="off"
            >
            <div style="padding:0.375rem 0;font-size:0.75rem;color:hsl(var(--muted-foreground));display:flex;align-items:center;gap:0.5rem">
              <span>Slug:</span>
              <input
                id="post-slug"
                type="text"
                value="${escapeHtml(post?.slug || '')}"
                placeholder="post-slug"
                style="flex:1;border:none;border-bottom:1px dashed hsl(var(--border));background:transparent;font-family:var(--font-mono);font-size:0.75rem;padding:0 0 0.125rem;color:hsl(var(--muted-foreground));outline:none"
              >
            </div>
          </div>

          <!-- WYSIWYG editor container -->
          <div id="editor-container" class="editor-container" style="flex:1;border:none;border-radius:0"></div>
        </div>

        <!-- Meta sidebar -->
        <aside class="post-meta-panel">
          <div class="post-meta-header">Post Settings</div>

          <div class="post-meta-section">
            <div class="post-meta-label">Status</div>
            <select class="select" id="post-status">
              <option value="draft"     ${(!post || post.status === 'draft')     ? 'selected' : ''}>Draft</option>
              <option value="published" ${post?.status === 'published' ? 'selected' : ''}>Published</option>
              <option value="scheduled" ${post?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            </select>
          </div>

          <div class="post-meta-section">
            <div class="post-meta-label">Category</div>
            <select class="select" id="post-category">
              ${Store.getCategories().map(c =>
                `<option value="${escapeHtml(c)}" ${post?.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`
              ).join('')}
            </select>
            <input class="input" id="post-category-custom" type="text" placeholder="Or type a new category…" style="margin-top:0.375rem;font-size:0.8125rem">
          </div>

          <div class="post-meta-section">
            <div class="post-meta-label">Tags</div>
            <div id="tag-list" class="tag-list">
              ${(post?.tags || []).map(t => this._tagHtml(t)).join('')}
            </div>
            <div style="display:flex;gap:0.375rem">
              <input class="input" id="tag-input" type="text" placeholder="Add tag…" style="flex:1;font-size:0.8125rem">
              <button class="btn btn-secondary btn-sm" id="tag-add">Add</button>
            </div>
          </div>

          <div class="post-meta-section">
            <div class="post-meta-label">Excerpt</div>
            <textarea class="textarea" id="post-excerpt" rows="3" placeholder="Brief description of the post…">${escapeHtml(post?.excerpt || '')}</textarea>
          </div>

          <div class="post-meta-section">
            <div class="post-meta-label">Featured Image URL</div>
            <input class="input" id="post-featured-image" type="url" placeholder="https://…" value="${escapeHtml(post?.featuredImage || '')}" style="font-size:0.8125rem">
            <div id="featured-image-preview" style="margin-top:0.5rem"></div>
          </div>

          <div class="post-meta-section" style="margin-top:auto">
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              <button class="btn btn-primary" id="btn-save-post">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Post
              </button>
              ${postId ? `
              <button class="btn btn-outline btn-sm" onclick="CMS.navigate('#/posts')">
                ← Back to Posts
              </button>
              ` : ''}
            </div>
          </div>
        </aside>
      </div>
    `, true);

    // Init editor
    const editorEl = document.getElementById('editor-container');
    this.activeEditor = new Editor(editorEl, {
      placeholder: 'Start writing your post…',
      onChange: (html) => {
        this._pendingChanges = true;
        this._autosave();
      },
    });
    if (post?.content) this.activeEditor.setHTML(post.content);

    // Bindings
    this._bindEditorEvents(post);
  }

  _tagHtml(tag) {
    return `<span class="tag-item">${escapeHtml(tag)}<button class="tag-remove" data-tag="${escapeHtml(tag)}" aria-label="Remove tag">&times;</button></span>`;
  }

  _bindEditorEvents(post) {
    const titleInput = document.getElementById('post-title');
    const slugInput  = document.getElementById('post-slug');

    // Auto-generate slug from title
    titleInput?.addEventListener('input', () => {
      if (!this.activePostId || !slugInput.dataset.manuallyEdited) {
        slugInput.value = Store.slugify(titleInput.value);
      }
      this._pendingChanges = true;
    });
    slugInput?.addEventListener('input', () => {
      slugInput.dataset.manuallyEdited = '1';
    });

    // Featured image preview
    const imgInput = document.getElementById('post-featured-image');
    const imgPreview = document.getElementById('featured-image-preview');
    const updateImagePreview = () => {
      const url = imgInput?.value?.trim();
      imgPreview.innerHTML = url
        ? `<img src="${escapeHtml(url)}" style="width:100%;border-radius:var(--radius-md);aspect-ratio:16/9;object-fit:cover" onerror="this.style.display='none'">`
        : '';
    };
    imgInput?.addEventListener('input', debounce(updateImagePreview, 500));
    updateImagePreview();

    // Tags
    const tagInput = document.getElementById('tag-input');
    const tagList  = document.getElementById('tag-list');
    const addTag   = () => {
      const val = tagInput.value.trim().toLowerCase().replace(/\s+/g, '-');
      if (!val) return;
      // Check for duplicate
      const existing = [...tagList.querySelectorAll('.tag-item span, .tag-item')].map(el => el.textContent.replace('×', '').trim());
      if (existing.includes(val)) { tagInput.value = ''; return; }
      tagList.insertAdjacentHTML('beforeend', this._tagHtml(val));
      tagInput.value = '';
      this._pendingChanges = true;
    };
    document.getElementById('tag-add')?.addEventListener('click', addTag);
    tagInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
    tagList?.addEventListener('click', e => {
      if (e.target.classList.contains('tag-remove')) {
        e.target.closest('.tag-item').remove();
        this._pendingChanges = true;
      }
    });

    // Save button
    document.getElementById('btn-save-post')?.addEventListener('click', () => this._savePost());

    // Keyboard shortcut
    document.addEventListener('keydown', this._saveShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._savePost();
      }
    });
  }

  _getEditorData() {
    const title    = document.getElementById('post-title')?.value?.trim() || '';
    const slug     = document.getElementById('post-slug')?.value?.trim() || Store.slugify(title);
    const status   = document.getElementById('post-status')?.value || 'draft';
    const category = document.getElementById('post-category-custom')?.value?.trim() ||
                     document.getElementById('post-category')?.value || 'General';
    const excerpt  = document.getElementById('post-excerpt')?.value?.trim() || '';
    const featuredImage = document.getElementById('post-featured-image')?.value?.trim() || null;
    const content  = this.activeEditor ? this.activeEditor.getHTML() : '';
    const tags = [...document.querySelectorAll('#tag-list .tag-item')].map(el => {
      const txt = el.textContent.replace('×', '').trim();
      return txt;
    }).filter(Boolean);
    const readTime = Store.estimateReadTime(content);

    return { title, slug, status, category, excerpt, featuredImage, content, tags, readTime };
  }

  _savePost() {
    const data = this._getEditorData();
    let saved;

    if (this.activePostId) {
      saved = Store.updatePost(this.activePostId, data);
    } else {
      saved = Store.createPost(data);
      this.activePostId = saved.id;
      history.replaceState(null, '', `#/edit/${saved.id}`);
    }

    this._pendingChanges = false;
    this._updateDraftBadge();
    Toast.success('Post saved', { title: data.status === 'published' ? 'Published!' : 'Saved as draft' });
    this._setBreadcrumb(['Posts', data.title || 'Untitled']);
  }

  _autosave = debounce(() => {
    if (!this._pendingChanges) return;
    const data = this._getEditorData();
    if (!data.title && !data.content) return;
    if (this.activePostId) {
      Store.updatePost(this.activePostId, data);
    } else {
      const saved = Store.createPost(data);
      this.activePostId = saved.id;
      history.replaceState(null, '', `#/edit/${saved.id}`);
    }
    this._pendingChanges = false;
  }, 3000);

  // ---- Media Library ----------------------------------------------------

  _renderMedia() {
    this._setBreadcrumb(['Media']);
    this._setContent(this._mediaHtml());
    this._bindMediaEvents();
  }

  _mediaHtml() {
    const media = Store.getMedia();
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-title">Media Library</h1>
            <p class="page-description">${media.length} file${media.length !== 1 ? 's' : ''}</p>
          </div>
          <div class="page-actions">
            <label class="btn btn-primary" style="cursor:pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.875rem;height:0.875rem"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Upload
              <input type="file" id="media-upload" accept="image/*" multiple style="display:none">
            </label>
          </div>
        </div>

        ${media.length === 0
          ? `<div class="empty-state" style="border:2px dashed hsl(var(--border));border-radius:var(--radius-lg)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <div class="empty-state-title">No media yet</div>
              <div class="empty-state-description">Upload images to use in your posts.</div>
            </div>`
          : `<div id="media-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:0.75rem">
              ${media.map(m => this._mediaItemHtml(m)).join('')}
            </div>`}
      </div>
    `;
  }

  _mediaItemHtml(m) {
    return `
      <div class="card" style="overflow:hidden;cursor:pointer" data-media-id="${m.id}">
        <div style="aspect-ratio:1;overflow:hidden;background:hsl(var(--muted))">
          <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.name || '')}" style="width:100%;height:100%;object-fit:cover" loading="lazy">
        </div>
        <div style="padding:0.5rem">
          <div style="font-size:0.75rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(m.name || 'Image')}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.25rem">
            <span style="font-size:0.6875rem;color:hsl(var(--muted-foreground))">${Store.relativeTime(m.uploadedAt)}</span>
            <button class="btn btn-ghost btn-sm btn-icon" data-delete-media="${m.id}" style="width:1.25rem;height:1.25rem" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.75rem;height:0.75rem"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _bindMediaEvents() {
    const upload = document.getElementById('media-upload');
    upload?.addEventListener('change', e => {
      const files = [...e.target.files];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const entry = Store.addMedia({ name: file.name, url: ev.target.result, size: file.size, type: file.type });
          Toast.success(`${file.name} uploaded`);
          const grid = document.getElementById('media-grid');
          if (grid) {
            grid.insertAdjacentHTML('afterbegin', this._mediaItemHtml(entry));
          } else {
            this._renderMedia();
          }
        };
        reader.readAsDataURL(file);
      });
      upload.value = '';
    });

    document.getElementById('main-content')?.addEventListener('click', async e => {
      const delBtn = e.target.closest('[data-delete-media]');
      if (delBtn) {
        const id = delBtn.dataset.deleteMedia;
        const ok = await Dialog.confirm({ title: 'Delete media', description: 'This cannot be undone.', confirmText: 'Delete', destructive: true });
        if (!ok) return;
        Store.deleteMedia(id);
        delBtn.closest('[data-media-id]')?.remove();
        Toast.success('Media deleted');
      }
    });
  }

  // ---- Settings ---------------------------------------------------------

  _renderSettings() {
    this._setBreadcrumb(['Settings']);
    const s = Store.getSettings();
    this._setContent(`
      <div class="page" style="max-width:640px">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-title">Settings</h1>
            <p class="page-description">Configure your CMS preferences.</p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Site</div>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="form-group">
                  <label class="label" for="s-site-name">Site name</label>
                  <input class="input" id="s-site-name" type="text" value="${escapeHtml(s.siteName)}">
                </div>
                <div class="form-group">
                  <label class="label" for="s-site-desc">Description</label>
                  <textarea class="textarea" id="s-site-desc" rows="2">${escapeHtml(s.siteDescription)}</textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Author</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="label" for="s-author">Display name</label>
                <input class="input" id="s-author" type="text" value="${escapeHtml(s.author)}">
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Appearance</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="label">Theme</label>
                <div style="display:flex;gap:0.5rem">
                  <button class="btn ${Theme.get() === 'light' ? 'btn-primary' : 'btn-outline'}" id="s-theme-light">Light</button>
                  <button class="btn ${Theme.get() === 'dark'  ? 'btn-primary' : 'btn-outline'}" id="s-theme-dark">Dark</button>
                  <button class="btn ${Theme.get() === 'system' ? 'btn-primary' : 'btn-outline'}" id="s-theme-system">System</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Content</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="label" for="s-posts-per-page">Posts per page</label>
                <input class="input" id="s-posts-per-page" type="number" min="1" max="100" value="${s.postsPerPage}" style="width:8rem">
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.5rem">
            <button class="btn btn-primary" id="btn-save-settings">Save settings</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById('s-theme-light')?.addEventListener('click', () => Theme.set('light'));
    document.getElementById('s-theme-dark')?.addEventListener('click',  () => Theme.set('dark'));
    document.getElementById('s-theme-system')?.addEventListener('click', () => {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      Theme.set(sys);
    });

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      Store.saveSettings({
        siteName: document.getElementById('s-site-name')?.value.trim(),
        siteDescription: document.getElementById('s-site-desc')?.value.trim(),
        author: document.getElementById('s-author')?.value.trim(),
        postsPerPage: parseInt(document.getElementById('s-posts-per-page')?.value) || 10,
      });
      this._updateSidebarUser();
      Toast.success('Settings saved');
    });
  }

  // ---- Helpers ----------------------------------------------------------

  _setContent(html, fullHeight = false) {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = html;
    main.style.overflowY = fullHeight ? 'hidden' : '';
    // Remove any old save shortcut listeners
    if (this._saveShortcut) {
      document.removeEventListener('keydown', this._saveShortcut);
      this._saveShortcut = null;
    }
  }

  // ---- Static helpers ---------------------------------------------------

  static navigate(hash) {
    if (CMS.app._pendingChanges) {
      const proceed = window.confirm('You have unsaved changes. Leave without saving?');
      if (!proceed) return;
    }
    location.hash = hash;
  }
}

// ---- Bootstrap ----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const app = new CMS();
  app.init();

  // Expose for onclick handlers
  CMS.app = app;
  CMS.navigate = CMS.navigate.bind(CMS);
  window.CMS = CMS;
});
