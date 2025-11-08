import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

function setupGUI() {
    // --- Existing lil-gui for camera ---
    // const gui = new GUI();
    // const cameraFolder = gui.addFolder('Camera');
    // cameraFolder.add(camera.position, 'z', 0, 10);
    // cameraFolder.open();

    // --- New DOM-based buttons and timescale ---
    const viewBtn = document.getElementById('viewBtn');
    const asteroidBtn = document.getElementById('asteroidBtn');
    const timerBtn = document.getElementById('timerBtn');
    const timescaleContainer = document.getElementById('timescaleContainer');
    const timescaleSlider = document.getElementById('timescaleSlider');
    const timescaleNumber = document.getElementById("timescaleNumber");

    function updateTime(val) {
      if (val > 10) {
        val = 10;
      }
      if (val < 0) {
        val = 0;
      }
      timescaleSlider.value = val;
      timescaleNumber.value = val;

      return val;
    }

    let currentMode = 'view';
    let timescale = parseFloat(timescaleSlider.value);

    viewBtn.addEventListener('click', () => setMode('view'));
    asteroidBtn.addEventListener('click', () => setMode('asteroid'));
    timerBtn.addEventListener('click', () => {
        timescaleContainer.style.display =
            timescaleContainer.style.display === 'flex' ? 'none' : 'flex';
    });
    timescaleSlider.addEventListener('input', e => {
      timescale = parseFloat(e.target.value);
      timescaleNumber.value = timescale;
    });

    // When number input changes, update slider and state
    timescaleNumber.addEventListener('input', e => {
        let val = parseFloat(e.target.value);
        val = updateTime(val);
        timescale = val;
    });

    function setMode(mode) {
        currentMode = mode;
        viewBtn.classList.toggle('active', mode === 'view');
        asteroidBtn.classList.toggle('active', mode === 'asteroid');
    }

    // Return GUI object and state getters so main.js can use them
    return {
        getCurrentMode: () => currentMode,
        getTimescale: () => timescale
    };
}

export { setupGUI };
