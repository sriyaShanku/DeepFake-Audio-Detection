/**
 * animations.js - UI loading animations handling
 */

window.showLoadingSequence = async function () {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;

    // Reset steps
    const steps = document.querySelectorAll('.loading-step');
    steps.forEach(step => {
        step.classList.remove('opacity-100');
        step.classList.add('opacity-30');
        const spinner = step.querySelector('.spinner');
        const check = step.querySelector('.fa-check-circle');
        spinner.classList.remove('hidden');
        check.classList.add('hidden');
    });

    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');

    // Return a promise that resolves when sequence visual effect is done
    // In reality backend might respond faster, but we simulate a short delay for UX

    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Step 1: Uploading
    steps[0].classList.add('opacity-100');
    await delay(300);
    completeStep(steps[0]);

    // Step 2: Preprocessing
    steps[1].classList.add('opacity-100');
    // From here, we let the actual fetch request run in parallel
};

window.advanceLoadingSequence = async function () {
    const steps = document.querySelectorAll('.loading-step');
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Complete Step 2
    completeStep(steps[1]);

    // Step 3
    steps[2].classList.add('opacity-100');
    await delay(400);
    completeStep(steps[2]);

    // Step 4
    steps[3].classList.add('opacity-100');
    await delay(400);
    completeStep(steps[3]);

    // Step 5
    steps[4].classList.add('opacity-100');
    await delay(200);
    completeStep(steps[4]);

    await delay(300); // short pause before hiding overlay
}

window.hideLoadingSequence = function () {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
};

function completeStep(stepElement) {
    if (!stepElement) return;
    const spinner = stepElement.querySelector('.spinner');
    const check = stepElement.querySelector('.fa-check-circle');

    if (spinner) spinner.classList.add('hidden');
    if (check) check.classList.remove('hidden');
}
