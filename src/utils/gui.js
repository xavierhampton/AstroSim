function isActive(element) {
  return element.style.display !== 'none' && element.offsetParent !== null;
}


function setupGUI() {
    // --- DOM Elements ---
    const asteroidBtn = document.getElementById('asteroidBtn');
    const timerBtn = document.getElementById('timerBtn');
    const asteroidContainer = document.getElementById('asteroidContainer');
    const timescaleContainer = document.getElementById('timescaleContainer');
    const timescaleSlider = document.getElementById('timescaleSlider');
    const timescaleNumber = document.getElementById('timescaleNumber');

    // --- State ---
    let timescale = parseFloat(timescaleSlider.value);

    // --- Helper Functions ---
    const toggleDisplay = element => {
        element.style.display = element.style.display === 'flex' ? 'none' : 'flex';
    };

    const updateTimescale = value => {
        timescale = parseFloat(value);
        timescaleSlider.value = timescale;
        timescaleNumber.value = timescale;
    };

    // --- Event Listeners ---
    asteroidBtn.addEventListener('click', () => {
      toggleDisplay(asteroidContainer)
      if (isActive(timescaleContainer)) {
        toggleDisplay(timescaleContainer);
      };
    });

    timescaleSlider.addEventListener('input', e => updateTimescale(e.target.value));

    timescaleNumber.addEventListener('change', e => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) return (timescaleNumber.value = timescale);

        // Clamp between 0 and 10
        val = Math.min(Math.max(val, 0), 10);
        updateTimescale(val);
    });

    // --- Public API ---
    return {
        getCurrentMode: () => currentMode,
        getTimescale: () => timescale,
    };
}

export { setupGUI };
