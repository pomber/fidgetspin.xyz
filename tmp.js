goog.module('index'); exports = {}; var module = {id: 'index.js'};/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('./sw.js')
        .then(function () {
        console.log('service worker is all cool.');
    })
        .catch(function (e) {
        console.error('service worker is not so cool.', e);
        throw e;
    });
    if (navigator.serviceWorker.controller) {
        // Correctly prompt the user to reload during SW phase change.
        navigator.serviceWorker.controller.onstatechange = e => {
            if (((e.target)).state === 'redundant') {
                ((((document.querySelector('#reload-prompt'))))).classList.remove('hidden');
            }
        };
    }
}
// thx https://github.com/Modernizr/Modernizr/blob/master/feature-detects/pointerevents.js
const /** @type {?} */ USE_POINTER_EVENTS = 'onpointerdown' in document.createElement('div');
let /** @type {?} */ velocity = 0;
const /** @type {?} */ ac = new (typeof webkitAudioContext !== 'undefined'
    ? webkitAudioContext
    : AudioContext)();
const /** @type {?} */ masterVolume = ac.createGain();
masterVolume.connect(ac.destination);
const /** @type {?} */ colors = ['#781c81', '#447cbf', '#83ba6d', '#dbab3b', '#d92120'];
const /** @type {?} */ appState = {
    pickerOpen: false,
    participants: [
        { name: 'Beto Cruz', reads: 9 + 32 },
        { name: 'Martin Spasiuk', reads: 29 + 74 },
        { name: 'Lucho Gomez', reads: 13 + 16 + 16 },
        { name: 'Gera  Massenzano', reads: 4 },
        { name: 'Maxi Guillen', reads: 33 }
    ],
    spinner: window.localStorage.getItem('fidget_spinner') ||
        './assets/spinners/arrow.png',
    muted: window.localStorage.getItem('fidget_muted') === 'true' ? true : false,
    spins: window.localStorage.getItem('fidget_spins')
        ? parseInt(/** @type {?} */ ((window.localStorage.getItem('fidget_spins'))), 10)
        : 0,
    maxVelocity: window.localStorage.getItem('fidget_max_velocity')
        ? parseInt(/** @type {?} */ ((window.localStorage.getItem('fidget_max_velocity'))), 10)
        : 0
};
const /** @type {?} */ spinners = [
    {
        path: './assets/spinners/arrow.png',
        name: 'The Classic',
        unlockedAt: 0
    },
    {
        path: './assets/spinners/triple.png',
        name: 'The Triple',
        unlockedAt: 500
    },
    {
        path: './assets/spinners/pokeball.png',
        name: "The 'Chu",
        unlockedAt: 2000
    },
    {
        path: './assets/spinners/cube.png',
        name: 'The Cubist',
        unlockedAt: 5000
    },
    {
        path: './assets/spinners/fractal.png',
        name: 'The Fractal',
        unlockedAt: 10000
    }
];
const /** @type {?} */ domElements = {
    turns: /** @type {?} */ ((document.getElementById('turns'))),
    velocity: /** @type {?} */ ((document.getElementById('velocity'))),
    maxVelocity: /** @type {?} */ ((document.getElementById('maxVelocity'))),
    spinner: /** @type {?} */ ((document.getElementById('spinner'))),
    traceSlow: /** @type {?} */ ((document.getElementById('trace-slow'))),
    traceFast: /** @type {?} */ ((document.getElementById('trace-fast'))),
    toggleAudio: /** @type {?} */ ((document.getElementById('toggle-audio'))),
    spinners: /** @type {?} */ (Array.from(/** @type {?} */ ((document.getElementsByClassName('spinner'))))),
    pickerToggle: /** @type {?} */ ((document.getElementById('picker'))),
    pickerPane: /** @type {?} */ ((document.getElementById('spinner-picker')))
};
let /** @type {?} */ fidgetAlpha = 0;
let /** @type {?} */ fidgetSpeed = 0;
let /** @type {?} */ winnerAlpha = null;
/**
 * @param {?} fn
 * @return {?}
 */
function deferWork(fn) {
    if (((typeof requestIdleCallback)) !== 'undefined') {
        requestIdleCallback(fn, { timeout: 60 });
    }
    else if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(fn);
    }
    else {
        setTimeout(fn, 16.66);
    }
}
/**
 * @return {?}
 */
function stats() {
    velocity =
        Math.abs(fidgetSpeed * 60 /* fps */ * 60 /* sec */ / 2 / Math.PI) | 0;
    const /** @type {?} */ newMaxVelocity = Math.max(velocity, appState.maxVelocity);
    if (appState.maxVelocity !== newMaxVelocity) {
        deferWork(() => window.localStorage.setItem('fidget_max_velocity', `${appState.maxVelocity}`));
        appState.maxVelocity = newMaxVelocity;
    }
    appState.spins += Math.abs(fidgetSpeed / 2 / Math.PI);
    deferWork(() => window.localStorage.setItem('fidget_spins', `${appState.spins}`));
    const /** @type {?} */ turnsText = appState.spins.toLocaleString(undefined, {
        maximumFractionDigits: 0
    });
    const /** @type {?} */ maxVelText = appState.maxVelocity.toLocaleString(undefined, {
        maximumFractionDigits: 1
    });
    domElements.turns.textContent = `${turnsText}`;
    domElements.velocity.textContent = `${velocity}`;
    domElements.maxVelocity.textContent = `${maxVelText}`;
}
const /** @type {?} */ spinnerPos = domElements.spinner.getBoundingClientRect();
const /** @type {?} */ centerX = spinnerPos.left + spinnerPos.width / 2;
const /** @type {?} */ centerY = spinnerPos.top + spinnerPos.height / 2;
const /** @type {?} */ centerRadius = spinnerPos.width / 10;
//
// Spin code
//
const /** @type {?} */ touchInfo = { alpha: 0, radius: 0, down: false };
let /** @type {?} */ touchSpeed = 0;
let /** @type {?} */ lastTouchAlpha = 0;
/**
 * @param {?} e
 * @return {?}
 */
function getXYFromTouchOrPointer(e) {
    let /** @type {?} */ x = 'touches' in e
        ? ((e)).touches[0].clientX
        : ((e)).clientX;
    let /** @type {?} */ y = 'touches' in e
        ? ((e)).touches[0].clientY
        : ((e)).clientY;
    return { x: x - centerX, y: y - centerY };
}
/**
 * @param {?} e
 * @return {?}
 */
function onTouchStart(e) {
    if (appState.pickerOpen) {
        return;
    }
    let { x, y } = getXYFromTouchOrPointer(e);
    onTouchMove(e);
    touchInfo.down = true;
    touchInfo.radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    lastTouchAlpha = touchInfo.alpha;
}
/**
 * @param {?} e
 * @return {?}
 */
function onTouchMove(e) {
    if (appState.pickerOpen) {
        return;
    }
    let { x, y } = getXYFromTouchOrPointer(e);
    touchInfo.alpha = Math.atan2(x, y);
    e.preventDefault();
}
/**
 * @return {?}
 */
function touchEnd() {
    if (appState.pickerOpen) {
        return;
    }
    touchInfo.down = false;
}
/**
 * @return {?}
 */
function tick() {
    requestAnimationFrame(() => {
        const /** @type {?} */ prevFidgetSpeed = fidgetSpeed;
        if (touchInfo.down) {
            winnerAlpha = null;
            if (touchInfo.radius > centerRadius) {
                touchSpeed = touchInfo.alpha - lastTouchAlpha;
                if (touchSpeed < -Math.PI)
                    touchSpeed += 2 * Math.PI;
                if (touchSpeed > Math.PI)
                    touchSpeed -= 2 * Math.PI;
                fidgetSpeed = touchSpeed;
                lastTouchAlpha = touchInfo.alpha;
            }
        }
        else if (touchSpeed) {
            fidgetSpeed = touchSpeed * touchInfo.radius / centerRadius;
            touchSpeed = 0;
        }
        fidgetAlpha -= fidgetSpeed;
        domElements.spinner.style.transform = `rotate(${fidgetAlpha}rad)`;
        domElements.traceSlow.style.opacity = Math.abs(fidgetSpeed) > 0.2
            ? '1'
            : '0.00001';
        domElements.traceFast.style.opacity = Math.abs(fidgetSpeed) > 0.4
            ? '1'
            : '0.00001';
        stats();
        // Slow down over time
        fidgetSpeed = fidgetSpeed * 0.99;
        fidgetSpeed =
            Math.sign(fidgetSpeed) * Math.max(0, Math.abs(fidgetSpeed) - 2e-4);
        if (!touchInfo.down && fidgetSpeed === 0 && prevFidgetSpeed !== 0) {
            winnerAlpha = fidgetAlpha % (Math.PI * 2);
            console.log('winner', winnerAlpha);
            const /** @type {?} */ winner = getWinner(winnerAlpha, getSlices(), getParticipants());
            alert(`And the winner is... ${winner}`);
        }
        const /** @type {?} */ soundMagnitude = Math.abs(velocity * Math.PI / 60);
        if (soundMagnitude && !touchInfo.down) {
            spinSound(soundMagnitude);
            spinSound2(soundMagnitude);
        }
        tick();
    });
}
//
// Audio code
//
let /** @type {?} */ endPlayTime = -1;
let /** @type {?} */ endPlayTime2 = -1;
/**
 * @record
 */
function rangeArgs() { }
/** @type {?} */
rangeArgs.prototype.inputMin;
/** @type {?} */
rangeArgs.prototype.inputMax;
/** @type {?} */
rangeArgs.prototype.outputFloor;
/** @type {?} */
rangeArgs.prototype.outputCeil;
/**
 * @param {?} args
 * @return {?}
 */
function generateRange(args) {
    return function (x) {
        const /** @type {?} */ outputRange = args.outputCeil - args.outputFloor;
        const /** @type {?} */ inputPct = (x - args.inputMin) / (args.inputMax - args.inputMin);
        return args.outputFloor + inputPct * outputRange;
    };
}
const /** @type {?} */ freqRange400_2000 = generateRange({
    inputMin: 0,
    inputMax: 80,
    outputFloor: 400,
    outputCeil: 2000
});
const /** @type {?} */ freqRange300_1500 = generateRange({
    inputMin: 0,
    inputMax: 80,
    outputFloor: 300,
    outputCeil: 1500
});
const /** @type {?} */ easeOutQuad = (t) => t * (2 - t);
/**
 * @param {?} magnitude
 * @return {?}
 */
function spinSound(magnitude) {
    // automation start time
    let /** @type {?} */ time = ac.currentTime;
    const /** @type {?} */ freqMagnitude = magnitude;
    magnitude = Math.min(1, magnitude / 10);
    let /** @type {?} */ x = easeOutQuad(magnitude) * 1.1 - (0.6 - 0.6 * easeOutQuad(magnitude));
    if (time + x - easeOutQuad(magnitude) < endPlayTime) {
        return;
    }
    const /** @type {?} */ osc = ac.createOscillator();
    const /** @type {?} */ gain = ac.createGain();
    // enforce range
    magnitude = Math.min(1, Math.max(0, magnitude));
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(masterVolume);
    // max of 40 boops
    //const count = 6 + ( 1 * magnitude );
    // decay constant for frequency between each boop
    //const decay = 0.97;
    // starting frequency (min of 400, max of 900)
    let /** @type {?} */ freq = freqRange400_2000(freqMagnitude);
    // boop duration (longer for lower magnitude)
    let /** @type {?} */ dur = 0.1 * (1 - magnitude / 2);
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq * 1.8, (time += dur));
    endPlayTime = time + dur;
    // fade out the last boop
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, endPlayTime);
    // play it
    osc.start(ac.currentTime);
    osc.stop(endPlayTime);
}
/**
 * @param {?} magnitude
 * @return {?}
 */
function spinSound2(magnitude) {
    // automation start time
    let /** @type {?} */ time = ac.currentTime;
    const /** @type {?} */ freqMagnitude = magnitude;
    magnitude = Math.min(1, magnitude / 10);
    let /** @type {?} */ x = easeOutQuad(magnitude) * 1.1 - (0.3 - 0.3 * easeOutQuad(magnitude));
    if (time + x - easeOutQuad(magnitude) < endPlayTime2) {
        return;
    }
    const /** @type {?} */ osc = ac.createOscillator();
    const /** @type {?} */ gain = ac.createGain();
    // enforce range
    magnitude = Math.min(1, Math.max(0, magnitude));
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(masterVolume);
    var /** @type {?} */ freq = freqRange300_1500(freqMagnitude);
    // boop duration (longer for lower magnitude)
    var /** @type {?} */ dur = 0.05 * (1 - magnitude / 2);
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq * 1.8, (time += dur));
    endPlayTime2 = time + dur;
    // fade out the last boop
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, endPlayTime2);
    // play it
    osc.start(ac.currentTime);
    osc.stop(endPlayTime2);
}
/**
 * @return {?}
 */
function unlockAudio() {
    /**
     * @return {?}
     */
    function unlock() {
        // Create an empty buffer.
        const /** @type {?} */ source = ac.createBufferSource();
        source.buffer = ac.createBuffer(1, 1, 22050);
        source.connect(ac.destination);
        // Play the empty buffer.
        if (typeof source.start === 'undefined') {
            ((source)).noteOn(0);
        }
        else {
            source.start(0);
        }
        // Setup a timeout to check that we are unlocked on the next event loop.
        source.onended = function () {
            source.disconnect(0);
            // Remove the touch start listener.
            document.removeEventListener('touchend', unlock, true);
        };
    }
    document.addEventListener('touchend', unlock, true);
}
/**
 * @param {?} muted
 * @return {?}
 */
function setMutedSideEffects(muted) {
    domElements.toggleAudio.classList.toggle('muted', muted);
    masterVolume.gain.setValueAtTime(appState.muted ? 0 : 1, ac.currentTime);
    window.localStorage.setItem('fidget_muted', `${appState.muted}`);
}
/**
 * @return {?}
 */
function togglePicker() {
    if (appState.pickerOpen !== true) {
        appState.pickerOpen = !appState.pickerOpen;
        history.pushState(appState, '', '#picker');
        showPicker();
    }
    else {
        history.back();
    }
}
/**
 * @param {?} e
 * @return {?}
 */
function toggleAudio(e) {
    appState.muted = !appState.muted;
    setMutedSideEffects(appState.muted);
    // if something is spinning, we do not want to stop it if you touch the menu.
    e.stopPropagation();
}
/**
 * @param {?} src
 * @return {?}
 */
function changeSpinner(src) {
    appState.spinner = src;
    deferWork(() => window.localStorage.setItem('fidget_spinner', src));
    for (let /** @type {?} */ s of domElements.spinners) {
        s.src = src;
    }
}
/**
 * @param {?} e
 * @return {?}
 */
function pickSpinner(e) {
    const /** @type {?} */ target = (e.target);
    if (target.tagName === 'IMG' && !target.classList.contains('locked')) {
        changeSpinner(((e.target)).src);
        togglePicker();
    }
}
/**
 * @return {?}
 */
function showPicker() {
    domElements.pickerPane.innerHTML = '';
    let /** @type {?} */ toAppend = '';
    for (let /** @type {?} */ spinner of spinners) {
        toAppend += `<li><p class="title">${spinner.name}</p>`;
        if (spinner.unlockedAt >= appState.spins) {
            toAppend += `<img width="300" height="300" class="locked" src="${spinner.path}"><p class="locked-info">Unlocks at ${spinner.unlockedAt} spins</p>`;
        }
        else {
            toAppend += `<img width="300" height="300" src="${spinner.path}">`;
        }
        toAppend += '</li>';
    }
    domElements.pickerPane.innerHTML = toAppend;
    domElements.pickerPane.classList.remove('hidden');
    domElements.pickerPane.scrollTop = 0;
}
/**
 * @param {?} percent
 * @return {?}
 */
function getCoordinatesForPercent(percent) {
    const /** @type {?} */ x = Math.cos(2 * Math.PI * percent);
    const /** @type {?} */ y = Math.sin(2 * Math.PI * percent);
    return [x, y];
}
/**
 * @param {?} slices
 * @return {?}
 */
function drawSlices(slices) {
    let /** @type {?} */ cumulativePercent = 0;
    const /** @type {?} */ svgEl = document.querySelector('#wheel-container svg');
    if (!svgEl) {
        console.error('Missing svg element');
        return;
    }
    if (slices.length > colors.length) {
        console.error('We need more colors!');
        return;
    }
    slices.forEach((slice, index) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const /** @type {?} */ largeArcFlag = slice > 0.5 ? 1 : 0;
        const /** @type {?} */ pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0` // Line
        ].join(' ');
        const /** @type {?} */ pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathData);
        pathEl.setAttribute('fill', colors[index]);
        svgEl.appendChild(pathEl);
    });
}
/**
 * @param {?} participants
 * @return {?}
 */
function drawParticipants(participants) {
    const /** @type {?} */ el = document.querySelector('#participants');
    if (!el) {
        console.error('Missing #participants element');
        return;
    }
    const /** @type {?} */ children = participants.map((p, i) => {
        const /** @type {?} */ child = document.createElement('div');
        child.style.borderColor = colors[i];
        child.innerText = p;
        return child;
    });
    children.forEach(c => el.appendChild(c));
    return participants;
}
/**
 * @param {?} alpha
 * @param {?} slices
 * @param {?} participants
 * @return {?}
 */
function getWinner(alpha, slices, participants) {
    const /** @type {?} */ percent = alpha / (2 * Math.PI);
    let /** @type {?} */ cumulativePercent = 0;
    for (let /** @type {?} */ i = 0; i < slices.length; i++) {
        cumulativePercent += slices[i];
        if (percent <= cumulativePercent) {
            return participants[i];
        }
    }
    return 'WTF';
}
/**
 * @return {?}
 */
function getSlices() {
    const /** @type {?} */ totalReads = appState.participants.reduce((acc, p2) => acc + p2.reads, 0);
    return appState.participants.map(p => p.reads / totalReads);
}
/**
 * @return {?}
 */
function getParticipants() {
    return appState.participants.map(p => p.name);
}
(async () => {
    drawSlices(getSlices());
    drawParticipants(getParticipants());
    setMutedSideEffects(appState.muted);
    unlockAudio();
    tick();
    const /** @type {?} */ listenFor = (document.addEventListener);
    domElements.pickerToggle.addEventListener(USE_POINTER_EVENTS ? 'pointerdown' : 'touchstart', togglePicker);
    domElements.pickerPane.addEventListener('click', pickSpinner);
    domElements.toggleAudio.addEventListener(USE_POINTER_EVENTS ? 'pointerdown' : 'touchstart', toggleAudio);
    listenFor(USE_POINTER_EVENTS ? 'pointerdown' : 'touchstart', onTouchStart, {
        passive: false
    });
    listenFor(USE_POINTER_EVENTS ? 'pointermove' : 'touchmove', onTouchMove, {
        passive: false
    });
    listenFor(USE_POINTER_EVENTS ? 'pointerup' : 'touchend', touchEnd);
    listenFor(USE_POINTER_EVENTS ? 'pointercancel' : 'touchcancel', touchEnd);
    // Assume clean entry always.
    history.replaceState(null, '', '/');
    changeSpinner(appState.spinner);
    window.onpopstate = (e) => {
        // Assume if state is not set here picker is going to need to close.
        if (e.state === null) {
            appState.pickerOpen = false;
            domElements.pickerPane.classList.add('hidden');
            // Assume if state is set here picker is going to need to open.
        }
        else if (e.state !== null) {
            appState.pickerOpen = true;
            showPicker();
        }
    };
})();
//# sourceMappingURL=data:application/json;base64,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