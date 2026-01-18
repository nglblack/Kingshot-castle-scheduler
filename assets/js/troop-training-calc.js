// Troop Training Calculator JavaScript - Main Calculator

document.addEventListener('DOMContentLoaded', () => {
    initializeTroopTrainingCalculator();
});

function initializeTroopTrainingCalculator() {
    // Initialize all sub-calculators
    initializeMainTraining();
    initializeTrainingCapacity();
    initializeReverseCalculator();
    initializePromotionCalculator();
}

// ============================================
// MAIN TRAINING CALCULATOR (T11)
// ============================================

function initializeMainTraining() {
    const inputs = [
        'training-minister-buff',
        'training-state-buff',
        't11-infantry',
        't11-lancer',
        't11-marksman',
        'infantry-reduction',
        'lancer-reduction',
        'marksman-reduction'
    ];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', calculateMainTraining);
            element.addEventListener('input', calculateMainTraining);
        }
    });
    
    calculateMainTraining();
}

function calculateMainTraining() {
    const utils = window.GameToolsUtils;
    const data = window.TROOP_DATA;
    
    // Get buff values
    const ministerBuff = utils.getBuffValue('training-minister-buff');
    const stateBuff = utils.getBuffValue('training-state-buff');
    const totalBuff = ministerBuff + stateBuff;
    
    // Get troop quantities
    const infantryQty = utils.getNumericValue('t11-infantry');
    const lancerQty = utils.getNumericValue('t11-lancer');
    const marksmanQty = utils.getNumericValue('t11-marksman');
    
    // Get cost reduction multipliers
    const infantryReduction = parseFloat(document.getElementById('infantry-reduction').value);
    const lancerReduction = parseFloat(document.getElementById('lancer-reduction').value);
    const marksmanReduction = parseFloat(document.getElementById('marksman-reduction').value);
    
    // Calculate time for each troop type (T11 base time = 180 seconds)
    const baseTime = 180; // T11 base training time in seconds
    const timePerTroop = totalBuff > 0 ? baseTime / (1 + totalBuff) : baseTime;
    
    const infantryTime = infantryQty * timePerTroop;
    const lancerTime = lancerQty * timePerTroop;
    const marksmanTime = marksmanQty * timePerTroop;
    const totalTime = infantryTime + lancerTime + marksmanTime;
    
    // Display speedups needed
    const timeBreakdown = utils.secondsToTime(totalTime);
    utils.displayTimeResult('speedups', timeBreakdown);
    
    // Calculate resources
    const infantryMeat = data.infantry.T11.meat * infantryQty * infantryReduction;
    const infantryWood = data.infantry.T11.wood * infantryQty * infantryReduction;
    const infantryCoal = data.infantry.T11.coal * infantryQty * infantryReduction;
    const infantryIron = data.infantry.T11.iron * infantryQty * infantryReduction;
    
    const lancerMeat = data.lancer.T11.meat * lancerQty * lancerReduction;
    const lancerWood = data.lancer.T11.wood * lancerQty * lancerReduction;
    const lancerCoal = data.lancer.T11.coal * lancerQty * lancerReduction;
    const lancerIron = data.lancer.T11.iron * lancerQty * lancerReduction;
    
    const marksmanMeat = data.marksman.T11.meat * marksmanQty * marksmanReduction;
    const marksmanWood = data.marksman.T11.wood * marksmanQty * marksmanReduction;
    const marksmanCoal = data.marksman.T11.coal * marksmanQty * marksmanReduction;
    const marksmanIron = data.marksman.T11.iron * marksmanQty * marksmanReduction;
    
    const totalMeat = infantryMeat + lancerMeat + marksmanMeat;
    const totalWood = infantryWood + lancerWood + marksmanWood;
    const totalCoal = infantryCoal + lancerCoal + marksmanCoal;
    const totalIron = infantryIron + lancerIron + marksmanIron;
    
    // Display resources
    document.getElementById('cost-meat').textContent = `🥩 Meat: ${utils.formatNumber(totalMeat)}`;
    document.getElementById('cost-wood').textContent = `🪵 Wood: ${utils.formatNumber(totalWood)}`;
    document.getElementById('cost-coal').textContent = `⚫ Coal: ${utils.formatNumber(totalCoal)}`;
    document.getElementById('cost-iron').textContent = `⚙️ Iron: ${utils.formatNumber(totalIron)}`;
    
    // Calculate points (only Infantry has points in the datasheet)
    const svsPoints = infantryQty * data.infantry.T11.svs;
    const koiPoints = infantryQty * data.infantry.T11.koi;
    const asPoints = infantryQty * data.infantry.T11.as;
    const opPoints = infantryQty * data.infantry.T11.op;
    
    // Display points
    document.getElementById('points-svs').textContent = `SVS: ${utils.formatNumber(svsPoints)}`;
    document.getElementById('points-koi').textContent = `KOI: ${utils.formatNumber(koiPoints)}`;
    document.getElementById('points-as').textContent = `Alliance Showdown: ${utils.formatNumber(asPoints)}`;
    document.getElementById('points-op').textContent = `Office Project: ${utils.formatNumber(opPoints)}`;
    
    // Update training capacity calculator since it uses the same buffs
    calculateTrainingCapacity();
}

// ============================================
// TRAINING CAPACITY CALCULATOR
// ============================================

function initializeTrainingCapacity() {
    const inputs = ['base-capacity', 'gem-buff'];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', calculateTrainingCapacity);
            element.addEventListener('input', calculateTrainingCapacity);
        }
    });
    
    calculateTrainingCapacity();
}

function calculateTrainingCapacity() {
    const utils = window.GameToolsUtils;
    
    // Get base capacity
    const baseCapacity = utils.getNumericValue('base-capacity');
    
    // Get minister buff from main calculator
    const ministerBuff = utils.getBuffValue('training-minister-buff');
    
    // Get gem buff
    const gemBuff = utils.getBuffValue('gem-buff');
    
    // Calculate new capacity
    const totalBuff = ministerBuff + gemBuff;
    const newCapacity = Math.floor(baseCapacity * (1 + totalBuff));
    
    // Display new capacity
    const capacityElement = document.getElementById('new-capacity');
    if (capacityElement) {
        capacityElement.textContent = utils.formatNumber(newCapacity);
    }
    
    // Calculate queues needed based on total troops from main calculator
    const infantryQty = utils.getNumericValue('t11-infantry');
    const lancerQty = utils.getNumericValue('t11-lancer');
    const marksmanQty = utils.getNumericValue('t11-marksman');
    const totalTroops = infantryQty + lancerQty + marksmanQty;
    
    const queuesNeeded = newCapacity > 0 ? (totalTroops / newCapacity).toFixed(2) : 0;
    
    // Display queues needed
    const queuesElement = document.getElementById('queues-needed');
    if (queuesElement) {
        queuesElement.textContent = queuesNeeded;
    }
}

// ============================================
// REVERSE CALCULATOR (Speedups to Troops)
// ============================================

function initializeReverseCalculator() {
    const inputs = ['reverse-days', 'reverse-hours', 'reverse-minutes'];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', calculateReverseCalculator);
            element.addEventListener('input', calculateReverseCalculator);
        }
    });
    
    calculateReverseCalculator();
}

function calculateReverseCalculator() {
    const utils = window.GameToolsUtils;
    const data = window.TROOP_DATA;
    
    // Get available speedup time
    const days = utils.getNumericValue('reverse-days');
    const hours = utils.getNumericValue('reverse-hours');
    const minutes = utils.getNumericValue('reverse-minutes');
    const totalSeconds = utils.timeToSeconds(days, hours, minutes, 0);
    
    // Get buffs from main calculator
    const ministerBuff = utils.getBuffValue('training-minister-buff');
    const stateBuff = utils.getBuffValue('training-state-buff');
    const totalBuff = ministerBuff + stateBuff;
    
    // Calculate troops for each tier
    const resultsContainer = document.getElementById('reverse-results');
    if (!resultsContainer) return;
    
    let html = '<div class="troop-tier-results">';
    
    // Calculate for all tiers of infantry (example - can expand to all types)
    const tiers = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11'];
    
    tiers.forEach(tier => {
        const baseTime = data.infantry[tier].time;
        const adjustedTime = totalBuff > 0 ? baseTime / (1 + totalBuff) : baseTime;
        const troopCount = Math.floor(totalSeconds / adjustedTime);
        
        html += `
            <div class="tier-result-card">
                <h5>${tier} Infantry</h5>
                <div class="tier-result-value">${utils.formatNumber(troopCount)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

// ============================================
// PROMOTION CALCULATOR
// ============================================

function initializePromotionCalculator() {
    // Get all promotion inputs
    const troopTypes = ['inf', 'lan', 'mar'];
    const tiers = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'];
    
    troopTypes.forEach(type => {
        tiers.forEach(tier => {
            const element = document.getElementById(`promo-${type}-${tier}`);
            if (element) {
                element.addEventListener('change', calculatePromotion);
                element.addEventListener('input', calculatePromotion);
            }
        });
    });
    
    calculatePromotion();
}

function calculatePromotion() {
    const utils = window.GameToolsUtils;
    const data = window.TROOP_DATA;
    
    // Get buffs from main calculator
    const ministerBuff = utils.getBuffValue('training-minister-buff');
    const stateBuff = utils.getBuffValue('training-state-buff');
    const totalBuff = ministerBuff + stateBuff;
    
    // Map tier codes to data keys
    const tierMap = {
        't1': 'T1', 't2': 'T2', 't3': 'T3', 't4': 'T4', 't5': 'T5', 't6': 'T6',
        't7': 'T7', 't8': 'T8', 't9': 'T9', 't10': 'T10', 't11': 'T11'
    };
    
    const typeMap = {
        'inf': 'infantry',
        'lan': 'lancer',
        'mar': 'marksman'
    };
    
    let totalTime = 0;
    let totalMeat = 0, totalWood = 0, totalCoal = 0, totalIron = 0;
    let totalSVS = 0, totalKOI = 0, totalAS = 0, totalOP = 0;
    
    // Calculate for each troop type
    const results = {};
    
    Object.keys(typeMap).forEach(typeCode => {
        const typeName = typeMap[typeCode];
        const typeData = data[typeName];
        
        let typeTime = 0;
        let typeMeat = 0, typeWood = 0, typeCoal = 0, typeIron = 0;
        let typeSVS = 0, typeKOI = 0, typeAS = 0, typeOP = 0;
        
        Object.keys(tierMap).forEach(tierCode => {
            const tierName = tierMap[tierCode];
            const quantity = utils.getNumericValue(`promo-${typeCode}-${tierCode}`);
            
            if (quantity > 0 && typeData[tierName]) {
                const stats = typeData[tierName];
                const adjustedTime = totalBuff > 0 ? stats.time / (1 + totalBuff) : stats.time;
                
                typeTime += quantity * adjustedTime;
                typeMeat += quantity * stats.meat;
                typeWood += quantity * stats.wood;
                typeCoal += quantity * stats.coal;
                typeIron += quantity * stats.iron;
                
                // Only infantry has points
                if (typeName === 'infantry' && stats.svs) {
                    typeSVS += quantity * stats.svs;
                    typeKOI += quantity * stats.koi;
                    typeAS += quantity * stats.as;
                    typeOP += quantity * stats.op;
                }
            }
        });
        
        results[typeName] = {
            time: typeTime,
            meat: typeMeat,
            wood: typeWood,
            coal: typeCoal,
            iron: typeIron,
            svs: typeSVS,
            koi: typeKOI,
            as: typeAS,
            op: typeOP
        };
        
        totalTime += typeTime;
        totalMeat += typeMeat;
        totalWood += typeWood;
        totalCoal += typeCoal;
        totalIron += typeIron;
        totalSVS += typeSVS;
        totalKOI += typeKOI;
        totalAS += typeAS;
        totalOP += typeOP;
    });
    
    // Display results
    const resultsContainer = document.getElementById('promotion-results');
    if (!resultsContainer) return;
    
    const totalTimeBreakdown = utils.secondsToTime(totalTime);
    
    let html = `
        <div class="results-grid">
            <!-- Infantry Results -->
            <div class="result-card">
                <h4>⚔️ Infantry</h4>
                <div class="result-value-small">Time: ${Math.floor(results.infantry.time / 3600)} hrs</div>
                <div class="result-value-small">Meat: ${utils.formatNumber(results.infantry.meat)}</div>
                <div class="result-value-small">Wood: ${utils.formatNumber(results.infantry.wood)}</div>
                <div class="result-value-small">Coal: ${utils.formatNumber(results.infantry.coal)}</div>
                <div class="result-value-small">Iron: ${utils.formatNumber(results.infantry.iron)}</div>
            </div>
            
            <!-- Lancer Results -->
            <div class="result-card">
                <h4>🐴 Lancer</h4>
                <div class="result-value-small">Time: ${Math.floor(results.lancer.time / 3600)} hrs</div>
                <div class="result-value-small">Meat: ${utils.formatNumber(results.lancer.meat)}</div>
                <div class="result-value-small">Wood: ${utils.formatNumber(results.lancer.wood)}</div>
                <div class="result-value-small">Coal: ${utils.formatNumber(results.lancer.coal)}</div>
                <div class="result-value-small">Iron: ${utils.formatNumber(results.lancer.iron)}</div>
            </div>
            
            <!-- Marksman Results -->
            <div class="result-card">
                <h4>🏹 Marksman</h4>
                <div class="result-value-small">Time: ${Math.floor(results.marksman.time / 3600)} hrs</div>
                <div class="result-value-small">Meat: ${utils.formatNumber(results.marksman.meat)}</div>
                <div class="result-value-small">Wood: ${utils.formatNumber(results.marksman.wood)}</div>
                <div class="result-value-small">Coal: ${utils.formatNumber(results.marksman.coal)}</div>
                <div class="result-value-small">Iron: ${utils.formatNumber(results.marksman.iron)}</div>
            </div>
            
            <!-- Total Time -->
            <div class="result-card">
                <h4>⏱️ Total Time</h4>
                <div class="result-value">${totalTimeBreakdown.days} Days</div>
                <div class="result-value">${totalTimeBreakdown.hours} Hours</div>
                <div class="result-value">${totalTimeBreakdown.minutes} Minutes</div>
            </div>
            
            <!-- Total Resources -->
            <div class="result-card">
                <h4>📦 Total Resources</h4>
                <div class="result-value-small">Meat: ${utils.formatNumber(totalMeat)}</div>
                <div class="result-value-small">Wood: ${utils.formatNumber(totalWood)}</div>
                <div class="result-value-small">Coal: ${utils.formatNumber(totalCoal)}</div>
                <div class="result-value-small">Iron: ${utils.formatNumber(totalIron)}</div>
            </div>
            
            <!-- Total Points -->
            <div class="result-card">
                <h4>🏆 Total Points</h4>
                <div class="result-value-small">SVS: ${utils.formatNumber(totalSVS)}</div>
                <div class="result-value-small">KOI: ${utils.formatNumber(totalKOI)}</div>
                <div class="result-value-small">AS: ${utils.formatNumber(totalAS)}</div>
                <div class="result-value-small">OP: ${utils.formatNumber(totalOP)}</div>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
}

// Export functions for use in other modules
window.TroopTrainingCalculator = {
    calculateMainTraining,
    calculateTrainingCapacity,
    calculateReverseCalculator,
    calculatePromotion
};
