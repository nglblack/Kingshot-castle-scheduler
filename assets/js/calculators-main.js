// Game Tools Main JavaScript - Tab Management and Initialization

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeSubTabs();
});

// Main Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            document.getElementById(`${targetTab}-content`).classList.add('active');
        });
    });
}

// Sub-Tab Management (for Training Calculator)
function initializeSubTabs() {
    const subTabButtons = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');
    
    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSubTab = button.dataset.subtab;
            
            // Remove active class from all sub-tabs
            subTabButtons.forEach(btn => btn.classList.remove('active'));
            subTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked sub-tab
            button.classList.add('active');
            document.getElementById(`${targetSubTab}-content`).classList.add('active');
        });
    });
}

// Utility function to format numbers with commas
function formatNumber(num) {
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility function to convert seconds to time breakdown
function secondsToTime(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return { days, hours, minutes, seconds };
}

// Utility function to convert time breakdown to seconds
function timeToSeconds(days, hours, minutes, seconds) {
    return (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
}

// Utility function to get buff percentage value
function getBuffValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? parseFloat(element.value) : 0;
}

// Utility function to get numeric input value
function getNumericValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? (parseInt(element.value) || 0) : 0;
}

// Display time breakdown in result elements
function displayTimeResult(prefix, timeObj) {
    const daysEl = document.getElementById(`${prefix}-days`);
    const hoursEl = document.getElementById(`${prefix}-hours`);
    const minutesEl = document.getElementById(`${prefix}-minutes`);
    const secondsEl = document.getElementById(`${prefix}-seconds`);
    
    if (daysEl) daysEl.textContent = `${timeObj.days} Day${timeObj.days !== 1 ? 's' : ''}`;
    if (hoursEl) hoursEl.textContent = `${timeObj.hours} Hour${timeObj.hours !== 1 ? 's' : ''}`;
    if (minutesEl) minutesEl.textContent = `${timeObj.minutes} Minute${timeObj.minutes !== 1 ? 's' : ''}`;
    if (secondsEl) secondsEl.textContent = `${timeObj.seconds} Second${timeObj.seconds !== 1 ? 's' : ''}`;
}

// Export utility functions for use by calculator modules
window.GameToolsUtils = {
    formatNumber,
    secondsToTime,
    timeToSeconds,
    getBuffValue,
    getNumericValue,
    displayTimeResult
};
