// Construction Calculator JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initializeConstructionCalculator();
});

function initializeConstructionCalculator() {
    // Get all input elements
    const inputs = [
        'const-minister-buff',
        'const-state-buff',
        'const-hyena-buff',
        'const-double-time',
        'const-days',
        'const-hours',
        'const-minutes',
        'const-seconds'
    ];
    
    // Add event listeners to all inputs
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', calculateConstruction);
            element.addEventListener('input', calculateConstruction);
        }
    });
    
    // Initial calculation
    calculateConstruction();
}

function calculateConstruction() {
    const utils = window.GameToolsUtils;
    
    // Get all buff values
    const ministerBuff = utils.getBuffValue('const-minister-buff');
    const stateBuff = utils.getBuffValue('const-state-buff');
    const hyenaBuff = utils.getBuffValue('const-hyena-buff');
    const doubleTime = utils.getBuffValue('const-double-time');
    
    // Calculate total buff percentage
    const totalBuff = ministerBuff + stateBuff + hyenaBuff + doubleTime;
    
    // Get original time inputs
    const days = utils.getNumericValue('const-days');
    const hours = utils.getNumericValue('const-hours');
    const minutes = utils.getNumericValue('const-minutes');
    const seconds = utils.getNumericValue('const-seconds');
    
    // Convert to total seconds
    const originalSeconds = utils.timeToSeconds(days, hours, minutes, seconds);
    
    // Calculate new time with buffs
    // Formula: New_Time = Original_Time / (1 + Total_Buff%)
    const newSeconds = totalBuff > 0 ? originalSeconds / (1 + totalBuff) : originalSeconds;
    
    // Convert back to time breakdown
    const newTime = utils.secondsToTime(newSeconds);
    
    // Display results
    utils.displayTimeResult('const-result', newTime);
    
    // Display total buff percentage
    const buffElement = document.getElementById('const-total-buff');
    if (buffElement) {
        buffElement.textContent = `${(totalBuff * 100).toFixed(1)}%`;
    }
}
