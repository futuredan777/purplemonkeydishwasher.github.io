/**
 * CMS — Data Store
 * In-memory store with localStorage persistence for posts, media, settings.
 */

const Store = (() => {
  const KEYS = { posts: 'cms_posts', settings: 'cms_settings', media: 'cms_media' };

  const defaults = {
    settings: {
      siteName: 'My Website',
      siteDescription: 'A simple CMS-powered site',
      postsPerPage: 10,
      theme: 'light',
      author: 'Admin',
    },
    posts: [
      {
        id: '1',
        title: 'Welcome to your CMS',
        slug: 'welcome-to-your-cms',
        status: 'published',
        category: 'General',
        tags: ['welcome', 'cms'],
        excerpt: 'This is your first post. Edit or delete it, then start writing!',
        content: '<h2>Welcome to your CMS</h2><p>This is your first post. Edit or delete it, then start writing!</p><p>Use the toolbar above to format your content. You can add <strong>bold text</strong>, <em>italic text</em>, headings, lists, and more.</p><blockquote>Tip: Use the sidebar on the right to set post metadata like status, category, and tags.</blockquote>',
        featuredImage: null,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        authorName: 'Admin',
        readTime: 1,
      },
      {
        id: '2',
        title: 'Getting started with the editor',
        slug: 'getting-started-with-the-editor',
        status: 'draft',
        category: 'Tutorial',
        tags: ['editor', 'howto'],
        excerpt: 'A quick guide to using the built-in WYSIWYG editor.',
        content: '<h2>The Editor</h2><p>This CMS ships with a full WYSIWYG editor built on the browser\'s native <code>contenteditable</code> API. It supports all common formatting operations.</p><h3>Formatting</h3><ul><li>Bold, italic, underline, strikethrough</li><li>Headings H1–H4</li><li>Ordered and unordered lists</li><li>Blockquotes and horizontal rules</li><li>Code blocks</li><li>Links</li></ul>',
        featuredImage: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        authorName: 'Admin',
        readTime: 2,
      },
    ],
    media: [],
  };

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }

  // --- Posts ---
  function getPosts() {
    return load(KEYS.posts) || [...defaults.posts];
  }
  function savePosts(posts) {
    save(KEYS.posts, posts);
  }
  function getPost(id) {
    return getPosts().find(p => p.id === id) || null;
  }
  function createPost(data) {
    const posts = getPosts();
    const post = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: '',
      slug: '',
      status: 'draft',
      category: 'General',
      tags: [],
      excerpt: '',
      content: '',
      featuredImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: getSettings().author || 'Admin',
      readTime: 1,
      ...data,
    };
    posts.unshift(post);
    savePosts(posts);
    return post;
  }
  function updatePost(id, data) {
    const posts = getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    posts[idx] = { ...posts[idx], ...data, updatedAt: new Date().toISOString() };
    savePosts(posts);
    return posts[idx];
  }
  function deletePost(id) {
    const posts = getPosts().filter(p => p.id !== id);
    savePosts(posts);
  }
  function duplicatePost(id) {
    const post = getPost(id);
    if (!post) return null;
    return createPost({
      ...post,
      id: undefined,
      title: post.title + ' (Copy)',
      slug: post.slug + '-copy',
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
    });
  }
  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // --- Settings ---
  function getSettings() {
    return { ...defaults.settings, ...(load(KEYS.settings) || {}) };
  }
  function saveSettings(data) {
    save(KEYS.settings, { ...getSettings(), ...data });
  }

  // --- Media ---
  function getMedia() {
    return load(KEYS.media) || [...defaults.media];
  }
  function addMedia(item) {
    const media = getMedia();
    const entry = { id: Date.now().toString(36), uploadedAt: new Date().toISOString(), ...item };
    media.unshift(entry);
    save(KEYS.media, media);
    return entry;
  }
  function deleteMedia(id) {
    save(KEYS.media, getMedia().filter(m => m.id !== id));
  }

  // --- Helpers ---
  function getCategories() {
    const cats = new Set(getPosts().map(p => p.category).filter(Boolean));
    return ['General', 'Tutorial', 'News', 'Update', ...cats].filter((v, i, a) => a.indexOf(v) === i);
  }
  function getStats() {
    const posts = getPosts();
    return {
      total:     posts.length,
      published: posts.filter(p => p.status === 'published').length,
      draft:     posts.filter(p => p.status === 'draft').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
    };
  }
  function estimateReadTime(html) {
    const text = html.replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }
  function formatDate(iso, opts = {}) {
    if (!iso) return '—';
    const d = new Date(iso);
    const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', { ...defaults, ...opts });
  }
  function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return formatDate(iso);
  }

  // Seed defaults if nothing in storage
  if (!load(KEYS.posts)) savePosts(defaults.posts);

  return {
    getPosts, savePosts, getPost, createPost, updatePost, deletePost,
    duplicatePost, slugify,
    getSettings, saveSettings,
    getMedia, addMedia, deleteMedia,
    getCategories, getStats, estimateReadTime, formatDate, relativeTime,
  };
})();

window.Store = Store;
