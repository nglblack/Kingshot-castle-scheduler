// Research Calculator JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initializeResearchCalculator();
});

function initializeResearchCalculator() {
    // Get all input elements
    const inputs = [
        'research-minister-buff',
        'research-state-buff',
        'research-days',
        'research-hours',
        'research-minutes',
        'research-seconds'
    ];
    
    // Add event listeners to all inputs
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', calculateResearch);
            element.addEventListener('input', calculateResearch);
        }
    });
    
    // Initial calculation
    calculateResearch();
}

function calculateResearch() {
    const utils = window.GameToolsUtils;
    
    // Get all buff values
    const ministerBuff = utils.getBuffValue('research-minister-buff');
    const stateBuff = utils.getBuffValue('research-state-buff');
    
    // Calculate total buff percentage
    const totalBuff = ministerBuff + stateBuff;
    
    // Get original time inputs
    const days = utils.getNumericValue('research-days');
    const hours = utils.getNumericValue('research-hours');
    const minutes = utils.getNumericValue('research-minutes');
    const seconds = utils.getNumericValue('research-seconds');
    
    // Convert to total seconds
    const originalSeconds = utils.timeToSeconds(days, hours, minutes, seconds);
    
    // Calculate new time with buffs
    // Formula: New_Time = Original_Time / (1 + Total_Buff%)
    const newSeconds = totalBuff > 0 ? originalSeconds / (1 + totalBuff) : originalSeconds;
    
    // Convert back to time breakdown
    const newTime = utils.secondsToTime(newSeconds);
    
    // Display results
    utils.displayTimeResult('research-result', newTime);
    
    // Display total buff percentage
    const buffElement = document.getElementById('research-total-buff');
    if (buffElement) {
        buffElement.textContent = `${(totalBuff * 100).toFixed(1)}%`;
    }
}
