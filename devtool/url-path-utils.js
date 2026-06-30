(function () {
  'use strict';

  const GITHUB_PAGES_USER = 'leandrogrochamedia';
  const GITHUB_PAGES_PROJECT = 'RankingProBeta';
  const ONLINE_ROOT = `https://${GITHUB_PAGES_USER}.github.io/${GITHUB_PAGES_PROJECT}/`;

  function githubPagesPathPrefix() {
    return new RegExp(`^/${GITHUB_PAGES_PROJECT}(?=/|$)`, 'i');
  }

  function getOnlinePreviewUrl(page) {
    const clean = String(page || 'index.html').replace(/^\//, '');
    return ONLINE_ROOT + clean;
  }

  function stripCacheBust(url) {
    if (!url) return '';
    try {
      const u = new URL(url, window.location.href);
      u.searchParams.delete('_viewer');
      u.searchParams.delete('_t');
      let out = u.toString();
      if (out.endsWith('?')) out = out.slice(0, -1);
      return out;
    } catch {
      return String(url)
        .replace(/([?&])_(viewer|t)=\d+/g, '')
        .replace(/\?&/, '?')
        .replace(/[?&]$/, '');
    }
  }

  function normalizeProjectRoot(root) {
    if (!root) return '';
    return String(root).replace(/\/$/, '');
  }

  function normalizeSitePath(pathname, search, hash) {
    let path = pathname || '/';
    if (!path.startsWith('/')) path = `/${path}`;
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return `${path}${search || ''}${hash || ''}`;
  }

  function sitePathToFullFile(projectRoot, sitePath) {
    const root = normalizeProjectRoot(projectRoot);
    if (!root) return sitePath || '';
    const rel = String(sitePath || '/')
      .replace(/^\//, '')
      .split('?')[0]
      .split('#')[0];
    return rel ? `${root}/${rel}` : `${root}/`;
  }

  function splitUrlSuffix(raw) {
    const hash = raw.includes('#') ? raw.slice(raw.indexOf('#')) : '';
    const beforeHash = hash ? raw.slice(0, raw.indexOf('#')) : raw;
    const search = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?')) : '';
    return { search, hash };
  }

  function toFilesystemPath(raw) {
    const clean = String(raw || '').trim();
    if (!clean) return '';
    if (clean.startsWith('file://')) {
      try {
        return decodeURIComponent(new URL(clean).pathname);
      } catch {
        return clean.replace(/^file:\/\//, '');
      }
    }
    return clean;
  }

  function parseFilesystemDisplay(raw, projectRoot) {
    const clean = String(raw || '').trim();
    const root = normalizeProjectRoot(projectRoot);
    if (!clean) return { path: '—', full: '' };

    const { search, hash } = splitUrlSuffix(clean);
    const filesystemPath = toFilesystemPath(clean.split('?')[0].split('#')[0]);

    if (root && filesystemPath.startsWith(root)) {
      const rel = filesystemPath.slice(root.length).replace(/^\/+/, '');
      const path = normalizeSitePath(`/${rel || ''}`, search, hash);
      const full = sitePathToFullFile(root, path);
      return { path, full };
    }

    const name = filesystemPath.split('/').pop() || filesystemPath;
    const path = normalizeSitePath(`/${name}`, search, hash);
    return {
      path,
      full: root ? sitePathToFullFile(root, path) : filesystemPath
    };
  }

  function extractAppSitePath(pathname, search, hash) {
    const path = (pathname || '').replace(/^\/app/, '') || '/';
    return normalizeSitePath(path, search || '', hash || '');
  }

  function extractGithubSitePath(pathname, search, hash) {
    const path = (pathname || '').replace(githubPagesPathPrefix(), '') || '/';
    return normalizeSitePath(path, search || '', hash || '');
  }

  /**
   * Path relativo à pasta do site (onde está index.html).
   * @param {string} rawUrl
   * @param {{ projectRoot?: string, preferOnline?: boolean }} [opts]
   */
  function parsePreviewUrl(rawUrl, opts = {}) {
    const clean = stripCacheBust(rawUrl);
    if (!clean || clean === 'about:blank') {
      return { path: '—', full: '' };
    }

    const projectRoot = normalizeProjectRoot(opts.projectRoot);

    if (/^file:\/\//i.test(clean)) {
      return parseFilesystemDisplay(clean, projectRoot);
    }

    if (projectRoot && !/^https?:\/\//i.test(clean) && !clean.startsWith('/app/')) {
      return parseFilesystemDisplay(clean, projectRoot);
    }

    if (clean.startsWith('/app/') || clean === '/app') {
      const qs = clean.includes('?') ? clean.slice(clean.indexOf('?')) : '';
      const hash = clean.includes('#') ? clean.slice(clean.indexOf('#')) : '';
      const pathOnly = clean.replace(/^\/app/, '').split('?')[0].split('#')[0] || '/';
      const path = normalizeSitePath(pathOnly, qs, hash);
      return {
        path,
        full: projectRoot ? sitePathToFullFile(projectRoot, path) : clean
      };
    }

    try {
      const u = new URL(clean, window.location.href);

      if (u.pathname === '/app' || u.pathname.startsWith('/app/')) {
        const path = extractAppSitePath(u.pathname, u.search, u.hash);
        return {
          path,
          full: projectRoot ? sitePathToFullFile(projectRoot, path) : u.href
        };
      }

      if (/github\.io$/i.test(u.hostname) && githubPagesPathPrefix().test(u.pathname)) {
        const path = extractGithubSitePath(u.pathname, u.search, u.hash);
        return { path, full: u.href };
      }

      if (opts.preferOnline) {
        const path = extractGithubSitePath(u.pathname, u.search, u.hash);
        return { path, full: u.href };
      }

      const path = normalizeSitePath(u.pathname || '/', u.search, u.hash);
      return {
        path,
        full: projectRoot ? sitePathToFullFile(projectRoot, path) : u.href
      };
    } catch {
      return { path: clean, full: clean };
    }
  }

  /** Label estático: pasta do projeto no disco (onde está index.html). */
  function formatRootLabel(projectRoot) {
    const root = normalizeProjectRoot(projectRoot);
    if (!root) return 'Root · —';
    return `Root · ${root}/`;
  }

  /** Label estático: root publicada online (sem espaços no slug). */
  function formatOnlineRootLabel() {
    return `${GITHUB_PAGES_PROJECT} · ${ONLINE_ROOT}`;
  }

  function formatOnlinePath(sitePath) {
    const rel = String(sitePath || '/').replace(/^\//, '') || 'index.html';
    return `${GITHUB_PAGES_PROJECT}/${rel}`;
  }

  window.PreviewUrlDisplay = {
    GITHUB_PAGES_USER,
    GITHUB_PAGES_PROJECT,
    ONLINE_ROOT,
    getOnlinePreviewUrl,
    stripCacheBust,
    parsePreviewUrl,
    formatRootLabel,
    formatOnlineRootLabel,
    formatOnlinePath,
    sitePathToFullFile,
    parseFilesystemDisplay
  };
})();