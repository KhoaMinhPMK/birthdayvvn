const {
  gsap: {
    registerPlugin,
    set,
    to,
    timeline,
    delayedCall,
    utils: { random } },

  MorphSVGPlugin,
  Draggable } =
window;
registerPlugin(MorphSVGPlugin);

// Used to calculate distance of "tug"
let startX;
let startY;

const CORD_DURATION = 0.1;
const INPUT = document.querySelector('#light-mode');
const ARMS = document.querySelectorAll('.bear__arm');
const PAW = document.querySelector('.bear__paw');
const CORDS = document.querySelectorAll('.toggle-scene__cord');
const HIT = document.querySelector('.toggle-scene__hit-spot');
const DUMMY = document.querySelector('.toggle-scene__dummy-cord');
const DUMMY_CORD = document.querySelector('.toggle-scene__dummy-cord line');
const PROMPT = document.querySelector('[data-story-prompt]');
const COUNTDOWN = document.querySelector('[data-story-countdown]');
const COUNTDOWN_PARTS = {
  days: document.querySelector('[data-countdown-days]'),
  hours: document.querySelector('[data-countdown-hours]'),
  minutes: document.querySelector('[data-countdown-minutes]'),
  seconds: document.querySelector('[data-countdown-seconds]') };

const PROXY = document.createElement('div');
const endY = DUMMY_CORD.getAttribute('y2');
const endX = DUMMY_CORD.getAttribute('x2');
const COUNTDOWN_TARGET = new Date(2026, 4, 30, 20, 0, 0);
const UNLOCK_TIME = new Date(2026, 4, 30, 20, 0, 0); // 20:00 30/5 → unlock birthday page
const isUnlocked = () => Date.now() >= UNLOCK_TIME.getTime();
let countdownTimer;

// Hiện đếm ngược ngay khi load trang
window.addEventListener('load', () => {
  showCountdown();
});

// set init position
const RESET = () => {
  set(PROXY, {
    x: endX,
    y: endY });

};

const AUDIO = {
  BEAR_LONG: new Audio('https://assets.codepen.io/605876/bear-groan-long.mp3'),
  BEAR_SHORT: new Audio(
  'https://assets.codepen.io/605876/bear-groan-short.mp3'),

  DOOR_OPEN: new Audio('https://assets.codepen.io/605876/door-open.mp3'),
  DOOR_CLOSE: new Audio('https://assets.codepen.io/605876/door-close.mp3'),
  CLICK: new Audio('https://assets.codepen.io/605876/click.mp3') };

const STATE = {
  ON: false,
  ANGER: 0,
  HAS_OPENED_ONCE: false,
  COUNTDOWN_SHOWN: false };

const formatCountdownValue = value => String(Math.max(0, value)).padStart(2, '0');

const updateCountdown = () => {
  const remaining = Math.max(0, COUNTDOWN_TARGET.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;

  COUNTDOWN_PARTS.days.textContent = formatCountdownValue(days);
  COUNTDOWN_PARTS.hours.textContent = formatCountdownValue(hours);
  COUNTDOWN_PARTS.minutes.textContent = formatCountdownValue(minutes);
  COUNTDOWN_PARTS.seconds.textContent = formatCountdownValue(seconds);

  if (remaining === 0 && countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
};

const hidePrompt = () => {
  if (PROMPT) PROMPT.classList.add('is-hidden');
};

const showCountdown = () => {
  if (!COUNTDOWN || STATE.COUNTDOWN_SHOWN) return;

  STATE.COUNTDOWN_SHOWN = true;
  COUNTDOWN.hidden = false;
  updateCountdown();
  window.requestAnimationFrame(() => COUNTDOWN.classList.add('is-visible'));

  if (!countdownTimer) {
    countdownTimer = window.setInterval(updateCountdown, 1000);
  }
};

set(PAW, {
  transformOrigin: '50% 50%',
  xPercent: -30 });

set('.bulb', { z: 10 });
set(ARMS, {
  xPercent: 10,
  rotation: -90,
  transformOrigin: '100% 50%',
  yPercent: -2,
  display: 'block' });

const CONFIG = {
  ARM_DUR: 0.4,
  CLENCH_DUR: 0.1,
  BEAR_START: 40,
  BEAR_FINISH: -55,
  BEAR_ROTATE: -50,
  DOOR_OPEN: 25,
  INTRO_DELAY: 1,
  BEAR_APPEARANCE: 2,
  SLAM: 3,
  BROWS: 4 };

set('.bear__brows', { display: 'none' });
set('.bear', {
  rotate: CONFIG.BEAR_ROTATE,
  xPercent: CONFIG.BEAR_START,
  transformOrigin: '50% 50%',
  scale: 0,
  display: 'block' });


RESET();

const CORD_TL = (source = 'user') => {
  const TL = timeline({
    paused: false,
    onStart: () => {
      // Hook this up to localStorage for jhey.dev
      STATE.ON = !STATE.ON;
      INPUT.checked = !STATE.ON;
      set(document.documentElement, { '--on': STATE.ON ? 1 : 0 });
      set([DUMMY], { display: 'none' });
      set(CORDS[0], { display: 'block' });
      AUDIO.CLICK.play();

      if (source === 'user' && STATE.ON && !STATE.HAS_OPENED_ONCE) {
        STATE.HAS_OPENED_ONCE = true;
        hidePrompt();
      }
    },
    onComplete: () => {
      // BEAR_TL.restart()
      set([DUMMY], { display: 'block' });
      set(CORDS[0], { display: 'none' });
      RESET();

      // if (source === 'bear' && !STATE.ON && STATE.HAS_OPENED_ONCE) {
      //   showCountdown();
      // }
    } });

  for (let i = 1; i < CORDS.length; i++) {
    TL.add(
    to(CORDS[0], {
      morphSVG: CORDS[i],
      duration: CORD_DURATION,
      repeat: 1,
      yoyo: true }));


  }
  return TL;
};

/**
 * Mess around with the actial input toggling here.
 */
const BEAR_TL = () => {
  const ARM_SWING = STATE.ANGER > 4 ? 0.2 : CONFIG.ARM_DUR;
  const SLIDE = STATE.ANGER > CONFIG.BROWS + 3 ? 0.2 : random(0.2, 0.6);
  const CLOSE_DELAY = STATE.ANGER >= CONFIG.INTRO_DELAY ? random(0.2, 2) : 0;
  const TL = timeline({
    paused: false }).

  to('.door', {
    onStart: () => AUDIO.DOOR_OPEN.play(),
    rotateY: 25,
    duration: 0.2 }).

  add(
  STATE.ANGER >= CONFIG.BEAR_APPEARANCE && Math.random() > 0.25 ?
  to('.bear', {
    onStart: () => {
      if (Math.random() > 0.5) {
        // delayedCall(random(0, 1.5), () => {
        //   AUDIO[
        //     STATE.ANGER >= CONFIG.BROWS && Math.random() > 0.5
        //       ? 'BEAR_LONG'
        //       : 'BEAR_SHORT'
        //   ].play()
        // })
      }
      set('.bear', { scale: 1 });
    },
    xPercent: CONFIG.BEAR_FINISH,
    repeat: 1,
    repeatDelay: 1,
    yoyo: true,
    duration: SLIDE }) :

  () => {}).

  to(ARMS, {
    delay: CLOSE_DELAY,
    duration: ARM_SWING,
    rotation: 0,
    xPercent: 0,
    yPercent: 0 }).

  to(
  [PAW, '#knuckles'],
  {
    duration: CONFIG.CLENCH_DUR,
    xPercent: (_, target) => target.id === 'knuckles' ? 10 : 0 },

  `>-${ARM_SWING * 0.5}`).

  to(ARMS, {
    duration: ARM_SWING * 0.5,
    rotation: 5 }).

  to(ARMS, {
    rotation: -90,
    xPercent: 10,
    duration: ARM_SWING,
    onComplete: () => {
      to('.door', {
        onComplete: () => AUDIO.DOOR_CLOSE.play(),
        duration: 0.2,
        rotateY: 0 });

    } }).

  to(
  DUMMY_CORD,
  {
    duration: CONFIG.CLENCH_DUR,
    attr: {
      x2: parseInt(endX, 10) + 20,
      y2: parseInt(endY, 10) + 60 } },


  '<').

  to(
  DUMMY_CORD,
  {
    duration: CONFIG.CLENCH_DUR,
    attr: {
      x2: endX,
      y2: endY } },


  '>').

  to(
  [PAW, '#knuckles'],
  {
    duration: CONFIG.CLENCH_DUR,
    xPercent: (_, target) => target.id === 'knuckles' ? 0 : -28 },

  '<').

  add(() => CORD_TL('bear'), '<');
  return TL;
};

const IMPOSSIBLE_TL = () => {
  const tl = timeline({
    onStart: () => set(HIT, { display: 'none' }),
    onComplete: () => {
      set(HIT, { display: 'block' });
      if (!isUnlocked()) {
        if (Math.random() > 0) STATE.ANGER = STATE.ANGER + 1;
        if (STATE.ANGER >= CONFIG.BROWS) set('.bear__brows', { display: 'block' });
      }
    }
  });

  tl.add(CORD_TL());

  if (isUnlocked()) {
    tl.add(() => delayedCall(0.8, () => { window.location.href = './birthday/'; }));
  } else {
    tl.add(BEAR_TL());
  }

  return tl;
};

Draggable.create(PROXY, {
  trigger: HIT,
  type: 'x,y',
  onPress: e => {
    startX = e.x;
    startY = e.y;
    RESET();
  },
  onDrag: function () {
    set(DUMMY_CORD, {
      attr: {
        x2: this.x,
        y2: this.y } });


  },
  onRelease: function (e) {
    const DISTX = Math.abs(e.x - startX);
    const DISTY = Math.abs(e.y - startY);
    const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
    to(DUMMY_CORD, {
      attr: { x2: endX, y2: endY },
      duration: CORD_DURATION,
      onComplete: () => {
        if (TRAVELLED > 50) {
          IMPOSSIBLE_TL();
        } else {
          RESET();
        }
      } });

  } });