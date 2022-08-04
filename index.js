/**
 * ========= CONFIGURING THE SDK & LOGIN ============
 */

import Config from './sdk/config/index.js';
import FRUser from './sdk/fr-user/index.js';
import TokenManager from './sdk/token-manager/index.js';
import UserManager from './sdk/user-manager/index.js';

const broadcast = new BroadcastChannel('fetchChannel');

Config.set({
  clientId: 'WebOAuthClient',
  redirectUri: `${window.location.origin}`,
  scope: 'openid profile me.read',
  serverConfig: {
    baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am',
    timeout: 3000,
  },
  realmPath: 'alpha',
  tokenStore: {
    async get(clientId) {
      return {};
    },
    async remove(clientId) {},
    async set(clientId, tokens) {
      broadcast.postMessage({ type: 'SET',  payload: tokens });
    },
  },
});

/**
 * ========= REDIRECT HANDLER =======================
 */

/**
 * Check URL for query parameters
 */
const url = new URL(document.location);
const params = url.searchParams;
const code = params.get('code');
const state = params.get('state');

/**
 * If the URL has state and code as query parameters, then the user
 * returned back here after successfully logging, so call authorize with
 * the values
 */
if (state && code) {
  await TokenManager.getTokens({ query: { code, state } });
  location.replace('http://localhost:8000');
}

/**
 * ========= ATTACH LISTENERS =======================
 */

const fetchBtn = document.getElementById('fetchBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const renewBtn = document.getElementById('renewBtn');

fetchBtn.addEventListener('click', async (e) => {
  await fetch('https://jsonplaceholder.typicode.com/todos');
});
loginBtn.addEventListener('click', async () => {
  /**
   * The key-value of `login: redirect` is what allows central-login.
   * Passing no arguments or a key-value of `login: 'embedded'` means
   * the app handles authentication locally.
   */
  await TokenManager.getTokens({ login: 'redirect', forceRenew: true });
  // const user = await UserManager.getCurrentUser();
  // console.log(user);
});
logoutBtn.addEventListener('click', async (e) => {
  FRUser.logout();
});
renewBtn.addEventListener('click', async (e) => {
  broadcast.postMessage({ type: 'REMOVE' });
  await TokenManager.getTokens({ login: 'redirect', forceRenew: true });
  // const user = await UserManager.getCurrentUser();
  // showUser(user);
});

/**
 * ========= SW REGISTRATION =========================
 */

broadcast.onmessage = (event) => {
  console.log(event.data);
};

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('sw.js', { type: 'module' });
    } catch (error) {
      console.error(`SW registration failed with ${error}`);
    }
  }
};

registerServiceWorker();
