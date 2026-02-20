import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- SOUND ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function wakeUpAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }

function playSound(type) {
    try {
        wakeUpAudio(); 
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'text') {
            osc.type = 'sine'; 
            const pitch = 450 + Math.random() * 250; 
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.05);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.015); // INCREASED VOLUME FROM 0.04
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); 
            osc.stop(now + 0.06);
        } else if (type === 'click' || type === 'start') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now);
            gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // INCREASED VOLUME FROM 0.1
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'success') {
            [440, 554.37, 659.25].forEach((freq, i) => { 
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
                g.gain.setValueAtTime(0, now + (i*0.1));
                g.gain.linearRampToValueAtTime(0.3, now + (i*0.1) + 0.05); // INCREASED VOLUME FROM 0.1
                g.gain.exponentialRampToValueAtTime(0.001, now + (i*0.1) + 0.5); 
                o.start(now + (i*0.1)); o.stop(now + (i*0.1) + 0.6);
            });
        } else if (type === 'congrats') {
            const notes = [523.25, 659.25, 783.99, 1046.50]; 
            notes.forEach((freq, i) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'triangle'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
                g.gain.setValueAtTime(0, now + (i*0.15));
                g.gain.linearRampToValueAtTime(0.4, now + (i*0.15) + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + (i*0.15) + 0.8);
                o.start(now + (i*0.15)); o.stop(now + (i*0.15) + 1.0);
            });
        }
    } catch (err) { }
}

// --- TYPEWRITER WITH LOCK ---
let isTyping = false; 
let typewriterTimeout = null; // Added to prevent overlaps if closed early

function runTypewriter(text, elementId) {
    isTyping = true; 
    if (typewriterTimeout) clearTimeout(typewriterTimeout); // Reset any existing typers
    const el = document.getElementById(elementId);
    if (!el) { isTyping = false; return; }
    el.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            // Added a check so it doesn't play sound on \n line breaks!
            if (text.charAt(i) !== ' ' && text.charAt(i) !== '.' && text.charAt(i) !== ',' && text.charAt(i) !== '\n') {
                playSound('text');
            }
            i++;
            typewriterTimeout = setTimeout(type, 30);
        } else {
            isTyping = false; 
        }
    }
    type();
}

// --- SHAN DIALOGUE ---
const shanDialogue = document.getElementById('shanDialogue');
const shanDialogueText = document.getElementById('shanDialogueText');
const shanDialogueClose = document.getElementById('shanDialogueClose');
let shanTypingActive = false;
let shanTypingTimer = null;
let shanHideTimer = null;

shanDialogueClose.addEventListener('click', () => {
    hideShanDialogue();
});

function showShanDialogue(text) {
    // Clear any pending hide timer
    if (shanHideTimer) { clearTimeout(shanHideTimer); shanHideTimer = null; }
    if (shanTypingTimer) { clearTimeout(shanTypingTimer); shanTypingTimer = null; }

    shanDialogueText.textContent = '';
    shanDialogue.style.display = 'block';
    // Force reflow for transition
    shanDialogue.offsetHeight;
    shanDialogue.classList.add('visible');

    // Typewrite the dialogue text
    shanTypingActive = true;
    let i = 0;
    function typeChar() {
        if (i < text.length) {
            shanDialogueText.textContent += text.charAt(i);
            if (text.charAt(i) !== ' ' && text.charAt(i) !== '.' && text.charAt(i) !== ',') {
                playSound('text');
            }
            i++;
            shanTypingTimer = setTimeout(typeChar, 35);
        } else {
            shanTypingActive = false;
            // Auto-hide after 5 seconds once done
            shanHideTimer = setTimeout(hideShanDialogue, 5000);
        }
    }
    typeChar();
}

function hideShanDialogue() {
    shanDialogue.classList.remove('visible');
    shanDialogue.style.opacity = '0';
    shanDialogue.style.transform = 'scale(0.88) translateX(-8px)';
    if (shanTypingTimer) { clearTimeout(shanTypingTimer); shanTypingTimer = null; }
    if (shanHideTimer) { clearTimeout(shanHideTimer); shanHideTimer = null; }
    shanTypingActive = false;
    setTimeout(() => {
        if (!shanDialogue.classList.contains('visible')) {
            shanDialogue.style.display = 'none';
            shanDialogue.style.opacity = '';
            shanDialogue.style.transform = '';
        }
    }, 360);
}

// Shan dialogue lines for touching her house (BIG APPLE)
const shanHouseDialogues = [
    "hey!! this is my house. please don't eat it.",
    "i worked very hard hollowing this out, thank you very much.",
    "yes it's an apple. no, you cannot have a bite.",
    "my house, my rules. no snacking allowed in here.",
    "i know it smells delicious. that's not the point.",
];
let shanDialogueIndex = 0;

// Random idle musings — Shan thinking out loud while you explore
const shanIdleDialogues = [
    "i can't wait to become a butterfly...",
    "do butterflies still like apples? asking for a friend.",
    "i've eaten 47 leaves today. personal best.",
    "sometimes i think about flying and i get a little emotional.",
    "wings. imagine having wings.",
    "i wonder if butterflies get hungry too.",
    "one day i'll have a bigger house. with windows.",
    "the grass feels really nice today actually.",
    "i'm not just a caterpillar. i'm a caterpillar with dreams.",
    "what if i become the prettiest butterfly. what then.",
    "eating is my love language.",
    "i should write a memoir. 'very hungry: a memoir by shan.'",
    "sometimes i look at the sky and think... yeah.",
    "chrysalis season can't come soon enough honestly.",
    "i have so many legs and yet. never enough.",
    "do you think butterflies remember being caterpillars?",
    "i'm going to be a GREAT butterfly.",
    "the audacity of that banana, just sitting there.",
    "just thinking about apples... as one does.",
    "i love this room. it has good energy.",
    "being small is actually very freeing. mostly.",
    "metamorphosis is just a glow-up with extra steps.",
    "i could really go for a snack right now.",
    "note to self: eat more.",
    "if i had a journal it would just say \'ate. good.\'",
    "ok but when is it MY turn to be beautiful.",
    "i practice my butterfly pose every night. just in case.",
    "a cocoon is just a cozy nap with benefits.",
];
const shuffledIdle = [...shanIdleDialogues].sort(() => Math.random() - 0.5);
let idleIndex = 0;
let idleDialogueTimer = null;

function scheduleNextIdle() {
    const delay = 9000 + Math.random() * 11000; // 9–20 sec
    idleDialogueTimer = setTimeout(() => {
        if (isGameActive && !shanDialogue.classList.contains('visible')) {
            const line = shuffledIdle[idleIndex % shuffledIdle.length];
            idleIndex++;
            if (idleIndex % shuffledIdle.length === 0) {
                shuffledIdle.sort(() => Math.random() - 0.5);
            }
            showShanDialogue(line);
        }
        scheduleNextIdle();
    }, delay);
}

// --- FRUIT TRACKER STATE ---
const foundFruits = { GOLDENAPPLE: false, MELON: false, BANANA: false, MANGO: false, PEAR: false };

// --- UI LOGIC ---
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const resetCamBtn = document.getElementById('resetCamBtn');
const gameBodyContainer = document.getElementById('dynamicContent');
const trackerPanel = document.getElementById('trackerPanel');
const congratsOverlay = document.getElementById('congratsOverlay');
const goodbyeBtn = document.getElementById('goodbyeBtn');

// MAIN MENU & README LOGIC
const mainMenuOverlay = document.getElementById('mainMenuOverlay');
const menuStartText = document.getElementById('menuStartText');
const menuReadmeText = document.getElementById('menuReadmeText');
const readmeOverlay = document.getElementById('readmeOverlay');
const readmeBackBtn = document.getElementById('readmeBackBtn');
const readmeSliderImg = document.getElementById('readmeSliderImg');
const readmePrevBtn = document.getElementById('readmePrevBtn');
const readmeNextBtn = document.getElementById('readmeNextBtn');

// Hover SFX
menuStartText.addEventListener('mouseenter', () => playSound('text'));
menuReadmeText.addEventListener('mouseenter', () => playSound('text'));

// ADD YOUR IMAGES HERE! (Paths updated)
const sliderImages = ['assets/images/creator.png', 'assets/images/screenshot1.png', 'assets/images/screenshot2.png'];
let currentSlideIndex = 0;

// This holds your story so \n works correctly with the typewriter!
const readmeTextContentStr = "hiii this is the creator, shan!!. \n\n so for some context, i made this for my UTS midterms to showcase my physical/sexual self in a creative form of a game.  in this game the caterpillar represents me, and my journey to metamorphosis (my truest self). \n\n i coded this with HTML, CSS, and JS and to bring the room to life in the browser, i coded the 3d interactions using Three.js. for the visuals, i used Blender to 3d model a bunch of the assets myself, and mixed in some free 3d resources as i was cramming this project xd. \n\n i hope i get my thoughts out even in a simple, and straightforward way. enjoi!!";

menuStartText.addEventListener('click', () => {
    mainMenuOverlay.style.display = 'none';
    startBtn.click();
});

menuReadmeText.addEventListener('click', () => {
    playSound('click');
    mainMenuOverlay.style.display = 'none';
    readmeOverlay.style.display = 'flex';
    runTypewriter(readmeTextContentStr, 'readmeText');
});

readmeBackBtn.addEventListener('click', () => {
    playSound('click');
    readmeOverlay.style.display = 'none';
    mainMenuOverlay.style.display = 'flex';
    if (typewriterTimeout) clearTimeout(typewriterTimeout); // Stops typing if you back out early
    isTyping = false;
});

readmePrevBtn.addEventListener('click', () => {
    playSound('click');
    currentSlideIndex = (currentSlideIndex - 1 + sliderImages.length) % sliderImages.length;
    readmeSliderImg.src = sliderImages[currentSlideIndex];
});

readmeNextBtn.addEventListener('click', () => {
    playSound('click');
    currentSlideIndex = (currentSlideIndex + 1) % sliderImages.length;
    readmeSliderImg.src = sliderImages[currentSlideIndex];
});

// --- ADDED: VOLUME LOGIC ---
const bgmAudioElement = document.getElementById('bgm');
const bgmVolumeInput = document.getElementById('bgmVolume');
bgmAudioElement.volume = bgmVolumeInput.value;
bgmVolumeInput.addEventListener('input', (e) => {
    bgmAudioElement.volume = e.target.value;
});

let storyCount = 0; 

startBtn.addEventListener('click', () => {
    playSound('start');
    document.getElementById('introBody').classList.remove('active-panel');
    document.getElementById('introBody').classList.add('hidden-panel');
    document.getElementById('gameBody').classList.remove('hidden-panel');
    document.getElementById('gameBody').classList.add('active-panel');
    settingsBtn.style.display = 'block';
    trackerPanel.style.display = 'block';
    resetCamBtn.style.display = 'block';
    document.getElementById('subHeaderText').innerText = "(famished)";
    gameBodyContainer.innerHTML = `
        <div class="section fade-slide-enter">
            <p id="introText" class="story-text"></p>
        </div>
    `;
    setTimeout(() => {
        if(gameBodyContainer.firstElementChild) gameBodyContainer.firstElementChild.classList.add('fade-slide-active');
    }, 10);
    storyCount = 1;
    runTypewriter("shan is a caterpillar, and caterpillars eat. find her favorite treat first, and she'll apple-solutely be grateful.", 'introText');
    if(loadedModel) loadedModel.visible = true;
    isGameActive = false;
    isCameraAnimating = true;
    // Kick off idle dialogue loop
    if (idleDialogueTimer) clearTimeout(idleDialogueTimer);
    scheduleNextIdle();
    startBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-block';
    const bgm = document.getElementById('bgm');
    if(bgm) bgm.play().catch(e => console.log("Audio blocked"));
});

settingsBtn.addEventListener('click', () => {
    if (isTyping) return; 
    playSound('click');
    document.getElementById('gameBody').classList.remove('active-panel');
    document.getElementById('gameBody').classList.add('hidden-panel');
    document.getElementById('introBody').classList.remove('hidden-panel');
    document.getElementById('introBody').classList.add('active-panel');
    settingsBtn.style.display = 'none';
    trackerPanel.style.display = 'none';
    resetCamBtn.style.display = 'none';
    document.getElementById('subHeaderText').innerText = "Find the hidden apples!";
    hideShanDialogue();
    if (idleDialogueTimer) { clearTimeout(idleDialogueTimer); idleDialogueTimer = null; }
});

resumeBtn.addEventListener('click', () => {
    playSound('click');
    document.getElementById('introBody').classList.remove('active-panel');
    document.getElementById('introBody').classList.add('hidden-panel');
    document.getElementById('gameBody').classList.remove('hidden-panel');
    document.getElementById('gameBody').classList.add('active-panel');
    settingsBtn.style.display = 'block';
    trackerPanel.style.display = 'block';
    resetCamBtn.style.display = 'block';
    document.getElementById('subHeaderText').innerText = "(famished)";
});

resetCamBtn.addEventListener('click', () => {
    playSound('click');
    isCameraAnimating = true;
    isGameActive = false;
});

if (goodbyeBtn) {
    goodbyeBtn.addEventListener('click', () => {
        playSound('click');
        setTimeout(() => {
            location.reload();
        }, 300);
    });
}

// --- 3D SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9CD5FF); 

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const sceneOffset = 8; 

const startPos = new THREE.Vector3(sceneOffset, 30, 60);
const targetPos = new THREE.Vector3(sceneOffset, 12, 25);

camera.position.copy(startPos);
camera.lookAt(sceneOffset, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; 
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.outputColorSpace = THREE.SRGBColorSpace; 
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 2.0);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 15); 
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.bias = -0.0005;

// --- FIX FOR CLIPPED SHADOWS ---
const d = 35; // Size of the shadow box
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.far = 100;
// -------------------------------

scene.add(dirLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.zoomSpeed = 1.2;    
controls.rotateSpeed = 0.5;  
controls.panSpeed = 0.5;  
controls.target.set(sceneOffset, 0, 0);

const activeKeys = {};
window.addEventListener('keydown', (e) => { activeKeys[e.code] = true; });
window.addEventListener('keyup', (e) => { activeKeys[e.code] = false; });

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 4.0;
outlinePass.visibleEdgeColor.set('#FCB53B'); 
composer.addPass(outlinePass);
composer.addPass(new OutputPass());

const loader = new GLTFLoader();
let loadedModel = null;
let isGameActive = false;
let isCameraAnimating = false;

// Updated Model Path here!
loader.load('assets/models/fuckmylifeblend.glb', (gltf) => {
    loadedModel = gltf.scene;
    loadedModel.visible = false; 
    loadedModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if(node.material) { node.material.metalness = 0.0; node.material.roughness = 0.8; }
        }
    });
    const box = new THREE.Box3().setFromObject(loadedModel);
    const center = box.getCenter(new THREE.Vector3());
    loadedModel.position.sub(center);
    loadedModel.position.x += sceneOffset;
    scene.add(loadedModel);
    document.getElementById('loading').style.display = 'none';
}, undefined, (error) => { console.error("Error loading GLB:", error); });

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const label = document.getElementById('hoverLabel');

const interactiveParts = [
    'goldenapple', 'tree of life', 'ladder', 'apple',
    'message', 'bowl', 'table', 'shelf', 
    'chair2', 'chair', 'melon', 'banana',
    'drawer', 'mango', 'pear', 'avo',
    'tree', 'grass', 'rug'
];

const displayNames = {
    'goldenapple': 'APPLE',
    'apple': 'BIG APPLE',
    'chair2': 'LEAFY CHAIR',
    'chair': 'CHAIR',
    'tree of life': 'TREE OF LIFE',
    'ladder': 'LADDER',
    'message': 'MESSAGE',
    'bowl': 'BOWL',
    'table': 'TABLE',
    'shelf': 'SHELF',
    'melon': 'MELON',
    'banana': 'BANANA',
    'drawer': 'DRAWER',
    'mango': 'MANGO',
    'pear': 'PEAR',
    'avo': 'AVO',
    'tree': 'TREE',
    'grass': 'GRASS',
    'rug': 'RUG'
};

const storyData = {
    'BIG APPLE': "but it's edible...",
    'TREE OF LIFE': "the great tree of life towers above. shan cranes her tiny neck upward, studying the ancient vines with wide, curious eyes.",
    'LADDER': "ah yes climb a ladder up to shan's heart.",
    'MESSAGE': "there's a tiny note pinned to the wall. it reads: 'don't eat the furniture! love, mom.' shan looks away innocently.",
    'BOWL': "an empty bowl",
    'TABLE': "perfect sized for a tiny tea party. shan imagines herself hosting one someday.",
    'SHELF': "book-caterpillars exist too.",
    'LEAFY CHAIR': "a cozy chair made entirely from a curled leaf. shan sometimes eat this chair",
    'CHAIR': "a simple wooden chair. sturdy. reliable. shan gives it a polite nod and moves on.",
    'MELON': "a juicy slice of melon! shan's eyes light up — but she shakes her head. apple first. that's the rule.",
    'BANANA': "a ripe yellow banana. shan stares at it longingly, then firmly looks away. apple. first.",
    'DRAWER': "nothing in here",
    'MANGO': "a golden mango, smelling incredible. shan files it away mentally for later — after the apple.",
    'PEAR': "a soft, green pear. shan gives it a gentle sniff. lovely, but not what she's after.",
    'AVO': "an avocado! very trendy. shan squints at it skeptically. maybe after the apple.",
    'TREE': "this is the tree of life. some branches are strong, others thin.",
    'GRASS': "let's touch some grass.",
    'RUG': "a woven rug, soft and cozy. shan wipes her feet on it out of habit, even though she doesn't have shoes or feet."
};

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    label.style.left = event.clientX + 'px';
    label.style.top = event.clientY + 'px';
    
    if (isGameActive && !isCameraAnimating) {
        if (!loadedModel || !loadedModel.visible) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(loadedModel.children, true);
        if (intersects.length > 0) {
            let current = intersects[0].object;
            let foundKey = null;
            let objectToHighlight = null;
            let rawName = current.name || "UNNAMED_MESH";
            while (current) {
                const nodeName = (current.name || "").toLowerCase();
                const match = interactiveParts.find(keyword => nodeName.includes(keyword));
                if (match) { foundKey = match; objectToHighlight = current; break; }
                if (current === loadedModel || current === scene) break;
                current = current.parent;
            }
            if (foundKey) {
                outlinePass.selectedObjects = [objectToHighlight];
                label.style.display = 'block';
                label.innerText = displayNames[foundKey] || foundKey.toUpperCase();
                document.body.style.cursor = 'pointer';
            } else {
                outlinePass.selectedObjects = [intersects[0].object];
                label.style.display = 'block';
                label.innerText = "DEBUG: " + rawName; 
                document.body.style.cursor = 'help';
            }
        } else {
            outlinePass.selectedObjects = [];
            label.style.display = 'none';
            document.body.style.cursor = 'default';
        }
    }
});

// --- DOUBLE CLICK INTERACTION ---
window.addEventListener('dblclick', (event) => {
    if (event.clientX < 460 || !label.innerText || label.innerText.includes("DEBUG")) return; 
    if (isTyping || isCameraAnimating) return; 

    const key = label.innerText;
    let storyText = storyData[key] || `shan inspects the ${key.toLowerCase()} with great curiosity.`;

    if (key === 'APPLE' && !foundFruits.GOLDENAPPLE) {
        foundFruits.GOLDENAPPLE = true;
        document.getElementById('track-apple').classList.add('found');
        playSound('success');
        storyText = "STAGE ONE FINISHED!\nthis apple is barely ripe. It used to hang lightly from the branch, unsure if it’s ready to fall.\n\nthis apple represent shan in this stage (just a larva) who don't know any better, this is her first, and she's lost.\n\n and ... shes famished again. now get her another snack. something one-in-a-melon";
    } else if (key === 'APPLE' && foundFruits.GOLDENAPPLE) {
        playSound('click');
        storyText = "shan already munched this one. she's still smiling about it.";
    } else if (key === 'BIG APPLE') {
        // Show Shan's dialogue bubble — she speaks up when you touch her house!
        playSound('click');
        const line = shanHouseDialogues[shanDialogueIndex % shanHouseDialogues.length];
        shanDialogueIndex++;
        showShanDialogue(line);
        storyText = "shan won't eat her big apple house. this is her sanctuary. her heart, literally.";
    } else if (key === 'MELON') {
        if (!foundFruits.GOLDENAPPLE) {
            storyText = "shan won't even look at the melon until she gets her apple.";
            playSound('click');
        } else if (!foundFruits.MELON) {
            foundFruits.MELON = true;
            document.getElementById('track-melon').classList.add('found');
            playSound('success');
            storyText = "STAGE TWO FINISHED!\nafter her watermelon session, shan has noticed she has becoming more heavy, and for the first time, she feels self consious.\n\nshe feels bananas. and now, shes thinking of eating bananas. ";
        } else {
            playSound('click');
            storyText = "shan already finished the melon. she licked the rind clean.";
        }
    } else if (key === 'BANANA') {
        if (!foundFruits.MELON) {
            storyText = "shan crosses her tiny arms. no bananas until she gets her melon! that's her rule and she's sticking to it.";
            playSound('click');
        } else if (!foundFruits.BANANA) {
            foundFruits.BANANA = true;
            document.getElementById('track-banana').classList.add('found');
            playSound('success');
            storyText = "STAGE THREE FINISHED!\nthis fruit curves in its own way, unfamiliar and uneven. shan feels the same. maybe she should stop eating.\n\none time her caterpillar friend suggested her an all leaf food diet. she said this is good practice before becoming a butterfly. a better version of yourself.\n\n shan worries that she won't mango her way to her true potential just like her friend said.";
        } else {
            playSound('click');
            storyText = "shan already ate the banana. she found the whole peeling process very satisfying.";
        }
    } else if (key === 'MANGO') {
        if (!foundFruits.BANANA) {
            storyText = "shan eyes the mango longingly. it smells incredible. but banana first — she has a system.";
            playSound('click');
        } else if (!foundFruits.MANGO) {
            foundFruits.MANGO = true;
            document.getElementById('track-mango').classList.add('found');
            playSound('success');
            storyText = "STAGE FOUR FINISHED!\nthis fruit glows warmly, full of sweetness.\n\n and so, shan has done what her friend said. leaf after leaf after leaf. but she this never felt happy as she does with her own shanenigans despite knowing this is a better way. her friend's way atleast. it worked on her, why wouldn't it work for shan? is shan an anomaly?\n\n it continue. so much doubt she feels. but then something snap. she can't live like this. comparison is a theif of joy, and she has been robbed for too long. she decides to just be her un-pear-fect self 'till she becomes a butterfly. and if she doesn't, \n\nshe'll die a happy caterpillar.";
        } else {
            playSound('click');
            storyText = "shan already demolished the mango. there is not a single fiber left.";
        }
    } else if (key === 'PEAR') {
        if (!foundFruits.MANGO) {
            storyText = "shan sniffs the pear appreciatively. very elegant. she'll come back for it — after the mango.";
            playSound('click');
        } else if (!foundFruits.PEAR) {
            foundFruits.PEAR = true;
            document.getElementById('track-pear').classList.add('found');
            playSound('success');
            storyText = "STAGE FIVE FINISHED!\nthis fruit rests gently in place, balanced and complete.\n\n shan, per usual, is doing her own thing. it's mundane but it's hers. and she loves it. she doesn't know if she'll ever want to be a butterfly. maybe being a caterpillar is enough for her";
            
            if (Object.values(foundFruits).every(v => v)) {
                setTimeout(() => {
                    isGameActive = false;
                    congratsOverlay.style.display = 'flex';
                    playSound('congrats');
                }, storyText.length * 30 + 1500); 
            }
        } else {
            playSound('click');
            storyText = "shan already finished the pear. she's still thinking about how good it was.";
        }
    } else {
        playSound('click');
    }

    if (storyCount >= 3) {
        gameBodyContainer.innerHTML = '';
        storyCount = 0;
    }
    storyCount++;
    const newId = 'story_' + Date.now();
    const newBlock = document.createElement('div');
    newBlock.className = 'section fade-slide-enter';
    newBlock.innerHTML = `
        <div class="section-title">${key}</div>
        <p id="${newId}" class="story-text"></p>
    `;
    gameBodyContainer.appendChild(newBlock);
    setTimeout(() => {
        newBlock.classList.add('fade-slide-active');
        newBlock.classList.remove('fade-slide-enter');
        runTypewriter(storyText, newId);
    }, 10);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    
    if (isCameraAnimating) {
        camera.position.lerp(targetPos, 0.03);
        camera.lookAt(sceneOffset, 0, 0);
        if (camera.position.distanceTo(targetPos) < 0.5) {
            camera.position.copy(targetPos);
            isCameraAnimating = false;
            isGameActive = true;
            controls.target.set(sceneOffset, 0, 0);
        }
    } else if (isGameActive) {
        let panX = 0, panY = 0, zoomDist = 0, rotateX = 0, rotateY = 0;
        const panSpeed = 0.3; 
        const keyZoomSpeed = 0.5;
        const keyRotateSpeed = 0.03; 
        if (activeKeys['KeyW']) panY += panSpeed;
        if (activeKeys['KeyS']) panY -= panSpeed;
        if (activeKeys['KeyA']) panX -= panSpeed;
        if (activeKeys['KeyD']) panX += panSpeed;
        if (activeKeys['KeyQ']) zoomDist += keyZoomSpeed; 
        if (activeKeys['KeyE']) zoomDist -= keyZoomSpeed; 
        if (activeKeys['ArrowLeft']) rotateX -= keyRotateSpeed;
        if (activeKeys['ArrowRight']) rotateX += keyRotateSpeed;
        if (activeKeys['ArrowUp']) rotateY -= keyRotateSpeed;
        if (activeKeys['ArrowDown']) rotateY += keyRotateSpeed;
        if (panX !== 0 || panY !== 0) {
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            right.setFromMatrixColumn(camera.matrix, 0);
            up.setFromMatrixColumn(camera.matrix, 1);
            const moveVector = new THREE.Vector3();
            moveVector.addScaledVector(right, panX);
            moveVector.addScaledVector(up, panY);
            camera.position.add(moveVector);
            controls.target.add(moveVector);
        }
        if (zoomDist !== 0) {
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
            const currentDist = dir.length();
            dir.normalize();
            camera.position.copy(controls.target).add(dir.multiplyScalar(currentDist + zoomDist));
        }
        if (rotateX !== 0 || rotateY !== 0) {
            const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
            const spherical = new THREE.Spherical().setFromVector3(offset);
            spherical.theta -= rotateX; 
            spherical.phi -= rotateY; 
            spherical.phi = Math.max(0.01, Math.min(controls.maxPolarAngle || Math.PI, spherical.phi));
            offset.setFromSpherical(spherical);
            camera.position.copy(controls.target).add(offset);
        }
    }

    controls.update();
    composer.render();
}

animate();