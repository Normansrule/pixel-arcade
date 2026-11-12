// Pixel Arcade desktop app: serves the same static site from inside the app over a private
// arcade:// scheme (ES modules and fetch() need a real origin, file:// is not enough).
const { app, BrowserWindow, protocol, net, shell, Menu, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([{ scheme: 'arcade', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
// packaged: the site is copied to resources/site; in development it is the repo root next to this folder
const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'site') : path.join(__dirname, '..');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 800, minHeight: 600, backgroundColor: '#000000',
    title: 'Pixel Arcade', autoHideMenuBar: true, icon: path.join(ROOT, 'docs', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, webviewTag: false }
  });
  win.loadURL('arcade://local/index.html');
  // external links (GitHub, score posting) open in the user's browser
  // only https links leave the app, and only to the user's own browser
  const external = url => { try { if (new URL(url).protocol === 'https:') shell.openExternal(url); } catch (_) { /* not a URL */ } };
  win.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('arcade://local/')) { e.preventDefault(); external(url); } });
  win.webContents.on('will-attach-webview', e => e.preventDefault());
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r' && input.shift)) { win.webContents.reload(); e.preventDefault(); }
  });
}

app.whenReady().then(() => {
  protocol.handle('arcade', req => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(ROOT, p));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  // the games need fullscreen, pointer lock (3D mouse look) and clipboard writes (room links); nothing else
  const ALLOW = new Set(['fullscreen', 'pointerLock', 'clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(ALLOW.has(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ALLOW.has(perm));
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
