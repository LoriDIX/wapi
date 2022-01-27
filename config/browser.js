'use strict'
var confApi = require('./api'); /* configurações da api */
var browser = [];
var configs = {};
const dotenv = require('dotenv');
dotenv.config();


const confEnv = process.env;

/* browserArgs */
browser = [
    "--enable-gpu",
    '--display-entrypoints',
    /* "--disable-gpu", 
    "--headless", */
    "--disable-http-cache", /* desativar cache da sessão */
    "no-sandbox",
    '--no-sandbox', 
    '--disable-setuid-sandbox', /* até orignal */
    '--disable-2d-canvas-clip-aa',
    '--disable-2d-canvas-image-chromium',
    '--disable-3d-apis',
    '--disable-accelerated-2d-canvas',
    '--disable-accelerated-jpeg-decoding',
    '--disable-accelerated-mjpeg-decode',
    '--disable-accelerated-video-decode',
    '--disable-app-list-dismiss-on-blur',
    '--disable-audio-output',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-canvas-aa',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-composited-antialiasing',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-field-trial-config',
    '--disable-fine-grained-time-zone-detection',
    '--disable-geolocation',
    '--disable-gl-extensions',
    '--disable-gpu',
    '--disable-gpu-early-init',
    '--disable-gpu-sandbox',
    '--disable-gpu-watchdog',
    '--disable-histogram-customizer',
    '--disable-in-process-stack-traces',
    '--disable-infobars',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-renderer-backgrounding',
    '--disable-session-crashed-bubble',
    '--disable-setuid-sandbox',
    '--disable-site-isolation-trials',
    '--disable-software-rasterizer',
    '--disable-sync',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--disable-translate',
    '--disable-webgl',
    '--disable-webgl2',
    '--enable-features=NetworkService',
    '--force-color-profile=srgb',
    '--headless',
    '--hide-scrollbars',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--ignore-gpu-blacklist',
    '--ignore-ssl-errors',
    '--log-level=3',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-crash-upload',
    '--no-default-browser-check',
    '--no-experiments',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--safebrowsing-disable-auto-update',
    '--silent-debugger-extension-api',
    '--single-process',
    '--unhandled-rejections=strict',
    '--window-position=0,0'
  ];


configs = {
    session: "",
    folderNameToken: "tokens", //folder name when saving tokens
    headless: true, // Headless chrome
    devtools: false, // Open devtools by default
    useChrome: true, // If false will use Chromium instance
    debug: false, // Opens a debug session
    logQR: true, // Logs QR automatically in terminal
    browserArgs: browser, // Parameters to be added into the chrome browser instance
    refreshQR: 12000, // Will refresh QR every 15 seconds, 0 will load QR once. Default is 30 seconds
    autoClose: confApi.sessions.autoClose, // Will auto close automatically if not synced, 'false' won't auto close. Default is 60 seconds (#Important!!! Will automatically set 'refreshQR' to 1000#)
    disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
    disableWelcome: true, // Will disable the welcoming message which appears in the beginning
    updatesLog:false,
    createPathFileToken:true,
    waitForLogin:true,
    tokenStore: 'file',
    puppeteerOptions: {
        userDataDir: confEnv.USE_MULTIDEVICE_CACHE == 'true' ? `tokens/${session}` : '' 
    },
    whatsappVersion: '',
  }

exports.configs = configs;
