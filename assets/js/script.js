// State Management
let alliances = [];
let schedule = {
    castle: {},
    'turret-i': {},
    'turret-ii': {},
    'turret-iii': {},
    'turret-iv': {}
};
let currentStructure = null;
let currentTime = null;

// Default example schedule
const defaultSchedule = {
    "alliances": [
        {
            "name": "FFA",
            "color": "#888888",
            "isFFA": true
        },
        {
            "name": "DrG",
            "color": "#ff6b6b",
            "isFFA": false
        },
        {
            "name": "686",
            "color": "#a29bfe",
            "isFFA": false
        },
        {
            "name": "MYS",
            "color": "#00b894",
            "isFFA": false
        },
        {
            "name": "FTP",
            "color": "#fdcb6e",
            "isFFA": false
        },
        {
            "name": "BSP",
            "color": "#d63031",
            "isFFA": false
        }
    ],
    "schedule": {
        "castle": {
            "12:00": "MYS",
            "12:30": "MYS",
            "13:00": "MYS",
            "13:30": "MYS",
            "14:00": "686",
            "14:30": "686",
            "15:00": "FTP",
            "15:30": "FTP",
            "16:00": "DrG",
            "16:30": "DrG",
            "17:00": "BSP",
            "17:30": "BSP"
        },
        "turret-i": {
            "12:00": "686",
            "12:30": "686",
            "13:00": "686",
            "13:30": "686",
            "14:00": "686",
            "14:30": "686",
            "15:00": "DrG",
            "15:30": "DrG",
            "16:00": "DrG",
            "16:30": "DrG",
            "17:00": "FFA",
            "17:30": "FFA"
        },
        "turret-ii": {
            "12:00": "FTP",
            "12:30": "FTP",
            "13:00": "FTP",
            "13:30": "FTP",
            "14:00": "FTP",
            "14:30": "FTP",
            "15:00": "FTP",
            "15:30": "FTP",
            "16:00": "FFA",
            "16:30": "FFA",
            "17:00": "FFA",
            "17:30": "FFA"
        },
        "turret-iii": {
            "12:00": "MYS",
            "12:30": "MYS",
            "13:00": "MYS",
            "13:30": "686",
            "14:00": "686",
            "14:30": "MYS",
            "15:00": "MYS",
            "15:30": "MYS",
            "16:00": "FFA",
            "16:30": "FFA",
            "17:00": "FFA",
            "17:30": "FFA"
        },
        "turret-iv": {
            "12:00": "DrG",
            "12:30": "DrG",
            "13:00": "DrG",
            "13:30": "DrG",
            "14:00": "BSP",
            "14:30": "BSP",
            "15:00": "BSP",
            "15:30": "BSP",
            "16:00": "BSP",
            "16:30": "BSP",
            "17:00": "BSP",
            "17:30": "BSP"
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check for shared schedule in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const lzData = urlParams.get('d'); // New LZString compressed format
    const oldData = urlParams.get('s') || urlParams.get('schedule'); // Old formats
    
    if (lzData) {
        try {
            // Decompress LZString data
            const jsonStr = LZString.decompressFromEncodedURIComponent(lzData);
            const decodedData = JSON.parse(jsonStr);
            
            // Decompress alliances
            alliances = decodedData.a.map(a => ({
                name: a.n,
                color: '#' + a.c, // Add # back
                isFFA: a.f === 1
            }));
            
            // Decompress schedule
            const structureMap = {
                'c': 'castle',
                '1': 'turret-i',
                '2': 'turret-ii',
                '3': 'turret-iii',
                '4': 'turret-iv'
            };
            
            schedule = {
                castle: {},
                'turret-i': {},
                'turret-ii': {},
                'turret-iii': {},
                'turret-iv': {}
            };
            
            Object.keys(decodedData.s).forEach(key => {
                const times = decodedData.s[key];
                const expandedTimes = {};
                Object.keys(times).forEach(shortTime => {
                    // Expand time: "1200" -> "12:00"
                    const fullTime = shortTime.slice(0, 2) + ':' + shortTime.slice(2);
                    expandedTimes[fullTime] = times[shortTime];
                });
                schedule[structureMap[key]] = expandedTimes;
            });
        } catch (e) {
            console.error('Error loading shared schedule:', e);
            loadFromLocalStorage();
        }
    } else if (oldData) {
        try {
            // Decode old format
            const decodedData = JSON.parse(atob(oldData));
            
            if (decodedData.a && decodedData.s) {
                // Old compressed format
                alliances = decodedData.a.map(a => ({
                    name: a.n,
                    color: a.c,
                    isFFA: a.f === 1
                }));
                
                const structureMap = {
                    'c': 'castle',
                    '1': 'turret-i',
                    '2': 'turret-ii',
                    '3': 'turret-iii',
                    '4': 'turret-iv'
                };
                
                schedule = {
                    castle: {},
                    'turret-i': {},
                    'turret-ii': {},
                    'turret-iii': {},
                    'turret-iv': {}
                };
                
                Object.keys(decodedData.s).forEach(key => {
                    schedule[structureMap[key]] = decodedData.s[key];
                });
            } else {
                // Original uncompressed format
                alliances = decodedData.alliances;
                schedule = decodedData.schedule;
            }
        } catch (e) {
            console.error('Error loading shared schedule:', e);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
    
    generateTimeline();
    renderAlliances();
    updateVisualMap(0);
});

// Edit Alliance Functions
let editingAllianceIndex = null;

function openEditAllianceModal(index) {
    editingAllianceIndex = index;
    const alliance = alliances[index];
    
    // Don't allow editing FFA
    if (alliance.isFFA) {
        alert('FFA alliance cannot be edited');
        return;
    }

    document.getElementById('edit-alliance-name').value = alliance.name;
    document.getElementById('edit-alliance-color').value = alliance.color;
    document.getElementById('edit-alliance-modal').style.display = 'flex';
}

function closeEditAllianceModal() {
    document.getElementById('edit-alliance-modal').style.display = 'none';
    editingAllianceIndex = null;
}

function saveAllianceEdit() {
    if (editingAllianceIndex === null) return;

    const newName = document.getElementById('edit-alliance-name').value.trim();
    const newColor = document.getElementById('edit-alliance-color').value;
    
    // Validate name
    if (!newName) {
        alert('Alliance name cannot be empty');
        return;
    }
    
    // Check if name already exists (excluding current alliance)
    if (alliances.some((a, i) => i !== editingAllianceIndex && a.name === newName)) {
        alert('An alliance with this name already exists');
        return;
    }
    
    const oldName = alliances[editingAllianceIndex].name;
    
    // Update alliance name and color
    alliances[editingAllianceIndex].name = newName;
    alliances[editingAllianceIndex].color = newColor;
    
    // Update schedule if name changed
    if (oldName !== newName) {
        Object.keys(schedule).forEach(structure => {
            Object.keys(schedule[structure]).forEach(time => {
                if (schedule[structure][time] === oldName) {
                    schedule[structure][time] = newName;
                }
            });
        });
    }

    closeEditAllianceModal();
    renderAlliances();
    generateTimeline();
    saveToLocalStorage();
    
    // Update visual map
    const slider = document.getElementById('time-slider');
    updatePreview();
}

// Auto-save on changes
function saveToLocalStorage() {
    localStorage.setItem('kingshot_alliances', JSON.stringify(alliances));
    localStorage.setItem('kingshot_schedule', JSON.stringify(schedule));
}

function loadFromLocalStorage() {
    // Always load the default example schedule on startup
    alliances = JSON.parse(JSON.stringify(defaultSchedule.alliances));
    schedule = JSON.parse(JSON.stringify(defaultSchedule.schedule));
}

// Alliance Management
function addAlliance() {
    const name = document.getElementById('alliance-name').value.trim();
    const color = document.getElementById('alliance-color').value;
    
    if (!name) {
        alert('Please enter an alliance name');
        return;
    }

    if (alliances.some(a => a.name === name)) {
        alert('Alliance already exists');
        return;
    }

    alliances.push({ name, color, isFFA: false });
    document.getElementById('alliance-name').value = '';
    // Reset to first color option
    document.getElementById('alliance-color').selectedIndex = 0;
    renderAlliances();
    saveToLocalStorage();
}

function addFFA() {
    if (alliances.some(a => a.isFFA)) {
        alert('FFA already exists');
        return;
    }

    alliances.push({ name: 'FFA', color: '#888888', isFFA: true });
    renderAlliances();
    saveToLocalStorage();
}

function removeAlliance(index) {
    const allianceName = alliances[index].name;
    if (confirm(`Remove ${allianceName}?`)) {
        // Remove alliance from the alliances array
        alliances.splice(index, 1);
        
        // Remove all assignments of this alliance from the schedule
        Object.keys(schedule).forEach(structure => {
            Object.keys(schedule[structure]).forEach(time => {
                if (schedule[structure][time] === allianceName) {
                    delete schedule[structure][time];
                }
            });
        });
        
        renderAlliances();
        saveToLocalStorage();
        generateTimeline();
        updateVisualMap(parseInt(document.getElementById('time-slider').value));
    }
}

function renderAlliances() {
    const list = document.getElementById('alliance-list');
    list.innerHTML = alliances.map((alliance, index) => `
        <div class="alliance-tag" style="background-color: ${alliance.color}; color: ${getContrastColor(alliance.color)};">
            <div class="color-box" style="background-color: ${alliance.color};" onclick="openEditAllianceModal(${index})"></div>
            <span onclick="openEditAllianceModal(${index})" style="cursor: pointer;">${alliance.name}</span>
            <button class="remove-btn" onclick="removeAlliance(${index})">×</button>
        </div>
    `).join('');
}

// Timeline Generation
function generateTimeline() {
    const interval = parseInt(document.getElementById('interval-select').value);
    const header = document.getElementById('timeline-header');
    const body = document.getElementById('timeline-body');

    // Generate time slots from 12:00 to 18:00
    const timeSlots = [];
    for (let hour = 12; hour < 18; hour++) {
        for (let min = 0; min < 60; min += interval) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }
    timeSlots.push('18:00');

    // Update slider max
    document.getElementById('time-slider').max = timeSlots.length - 1;

    // Generate header
    header.innerHTML = '<th>Structure</th>' + timeSlots.map((time, index) => {
        // Only show time at start of each interval (not the end time)
        if (index === timeSlots.length - 1) return ''; // Skip 18:00 header
        
        // Calculate end time for this slot
        const nextTime = timeSlots[index + 1];
        return `<th>${time}<br><span style="font-size: 9px; opacity: 0.8;">to ${nextTime}</span></th>`;
    }).join('');

    // Generate body
    const structures = [
        { id: 'castle', label: '🏰 Castle' },
        { id: 'turret-i', label: '🗼 Turret I' },
        { id: 'turret-ii', label: '🗼 Turret II' },
        { id: 'turret-iii', label: '🗼 Turret III' },
        { id: 'turret-iv', label: '🗼 Turret IV' }
    ];

    body.innerHTML = structures.map(structure => {
        const cells = timeSlots.slice(0, -1).map(time => { // Exclude 18:00 from cells
            const alliance = getActiveAllianceForCell(structure.id, time, timeSlots);
            const bgColor = alliance ? getAllianceById(alliance)?.color || '#555' : '#ffffff';
            const textColor = alliance ? getContrastColor(getAllianceById(alliance)?.color) : '#333';
            const allianceName = alliance ? getAllianceById(alliance)?.name || '' : '';
            
            return `<td style="background-color: ${bgColor}; color: ${textColor};" 
                        onclick="openAllianceModal('${structure.id}', '${time}')">
                        <div class="timeline-cell">${allianceName}</div>
                    </td>`;
        }).join('');

        return `<tr>
            <td class="structure-label">${structure.label}</td>
            ${cells}
        </tr>`;
    }).join('');
    
    // Update alliance stats
    updateAllianceStats();
}

// Get the active alliance for a specific cell
function getActiveAllianceForCell(structureId, time, timeSlots) {
    // Only return the alliance if it's explicitly set for this time
    return schedule[structureId][time] || null;
}

// Modal Functions
function openAllianceModal(structureId, time) {
    currentStructure = structureId;
    currentTime = time;
    
    const modalAlliances = document.getElementById('modal-alliances');
    
    // Check if there's already an assignment
    const currentAssignment = schedule[structureId][time];
    
    modalAlliances.innerHTML = alliances.map(alliance => `
        <button class="modal-alliance-btn" 
                style="background-color: ${alliance.color}; color: ${getContrastColor(alliance.color)};"
                onclick="assignAlliance('${alliance.name}')">
            ${alliance.name}
        </button>
    `).join('');

    // Add clear option (show differently if there's an assignment)
    if (currentAssignment) {
        modalAlliances.innerHTML += `
            <button class="modal-alliance-btn" 
                    style="background-color: #d9534f; color: white;"
                    onclick="assignAlliance(null)">
                ✕ Clear Assignment
            </button>
        `;
    } else {
        modalAlliances.innerHTML += `
            <button class="modal-alliance-btn" 
                    style="background-color: #6c757d; color: white;"
                    onclick="assignAlliance(null)">
                Clear (Empty)
            </button>
        `;
    }

    document.getElementById('alliance-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('alliance-modal').style.display = 'none';
    currentStructure = null;
    currentTime = null;
}

function assignAlliance(allianceName) {
    if (allianceName === null) {
        // Clear this time slot
        delete schedule[currentStructure][currentTime];
    } else {
        // Assign alliance to this time slot
        schedule[currentStructure][currentTime] = allianceName;
    }
    
    closeModal();
    generateTimeline();
    updateAllianceStats();
    saveToLocalStorage();
    
    // Update visual map to current preview time
    const slider = document.getElementById('time-slider');
    updatePreview();
}

// Calculate and display alliance statistics
function updateAllianceStats() {
    const stats = {};
    
    // Initialize stats for all alliances
    alliances.forEach(alliance => {
        stats[alliance.name] = {
            castle: 0,
            turrets: 0,
            total: 0
        };
    });
    
    // Count time slots for each structure
    Object.keys(schedule).forEach(structureId => {
        Object.keys(schedule[structureId]).forEach(time => {
            const allianceName = schedule[structureId][time];
            if (allianceName && stats[allianceName]) {
                const interval = parseInt(document.getElementById('interval-select').value);
                if (structureId === 'castle') {
                    stats[allianceName].castle += interval;
                } else {
                    stats[allianceName].turrets += interval;
                }
                stats[allianceName].total += interval;
            }
        });
    });
    
    // Build display for all alliances with time
    const statsElement = document.getElementById('total-stats');
    const allianceStats = [];
    
    Object.keys(stats).forEach(name => {
        const s = stats[name];
        if (s.total > 0) {
            const castleHours = (s.castle / 60).toFixed(1);
            const turretsHours = (s.turrets / 60).toFixed(1);
            allianceStats.push(`<div>${name}: ${castleHours}h castle, ${turretsHours}h turrets</div>`);
        }
    });
    
    statsElement.innerHTML = allianceStats.length > 0 ? allianceStats.join('') : 'No assignments';
}

function selectStructure(structureId) {
    // For now, this just highlights - could be expanded
    console.log('Selected:', structureId);
}

// Visual Map Update
function updatePreview() {
    const slider = document.getElementById('time-slider');
    const timeIndex = parseInt(slider.value);
    updateVisualMap(timeIndex);
}

function updateVisualMap(timeIndex) {
    const interval = parseInt(document.getElementById('interval-select').value);
    const timeSlots = [];
    for (let hour = 12; hour < 18; hour++) {
        for (let min = 0; min < 60; min += interval) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }
    timeSlots.push('18:00');

    const currentTime = timeSlots[timeIndex];
    document.getElementById('current-time-display').textContent = `${currentTime} UTC`;

    // Update castle
    const castleAlliance = getActiveAllianceAt('castle', currentTime, timeSlots);
    updateStructureVisual('castle', castleAlliance);

    // Update turrets
    ['turret-i', 'turret-ii', 'turret-iii', 'turret-iv'].forEach(turretId => {
        const turretAlliance = getActiveAllianceAt(turretId, currentTime, timeSlots);
        updateStructureVisual(turretId, turretAlliance);
    });
}

function getActiveAllianceAt(structureId, time, timeSlots) {
    // If explicitly assigned to this time slot, return it
    if (schedule[structureId][time]) {
        return schedule[structureId][time];
    }
    
    // If we're at 18:00 (the end), show the last scheduled period (17:30 for 30min intervals)
    if (time === '18:00') {
        // Find the last scheduled time before 18:00
        const scheduleKeys = Object.keys(schedule[structureId]).sort();
        if (scheduleKeys.length > 0) {
            // Return the last scheduled alliance
            return schedule[structureId][scheduleKeys[scheduleKeys.length - 1]] || null;
        }
    }
    
    return null;
}

function updateStructureVisual(structureId, allianceName) {
    const element = document.getElementById(structureId);
    const alliance = getAllianceById(allianceName);

    if (alliance) {
        element.style.background = alliance.color;
        element.style.borderColor = darkenColor(alliance.color);
        
        if (structureId === 'castle') {
            element.querySelector('.castle-label').textContent = alliance.name;
            element.querySelector('.castle-label').style.color = getContrastColor(alliance.color);
        } else {
            element.querySelector('.turret-label').textContent = alliance.name;
            element.querySelectorAll('.turret-label, .turret-number').forEach(el => {
                el.style.color = getContrastColor(alliance.color);
            });
        }
    } else {
        // Reset to default
        if (structureId === 'castle') {
            element.style.background = '#b8860b';
            element.style.borderColor = '#9a7209';
            element.querySelector('.castle-label').textContent = 'CASTLE';
            element.querySelector('.castle-label').style.color = '#fff';
        } else {
            element.style.background = '#708090';
            element.style.borderColor = '#5a6a78';
            element.querySelector('.turret-label').textContent = '-';
            element.querySelectorAll('.turret-label, .turret-number').forEach(el => {
                el.style.color = '#fff';
            });
        }
    }
}

function generateOutput() {
    const interval = parseInt(document.getElementById('interval-select').value);
    const timeSlots = [];
    for (let hour = 12; hour < 18; hour++) {
        for (let min = 0; min < 60; min += interval) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }

    // Build event timeline
    const events = [];
    
    timeSlots.forEach((time, index) => {
        const changes = detectChanges(time, timeSlots, index);
        if (changes.length > 0) {
            events.push({ time, changes });
        }
    });

    // Split into parts (max ~250 chars per part)
    const parts = splitIntoParts(events);
    
    // Render output
    renderOutput(parts);
}

function detectChanges(time, timeSlots, timeIndex) {
    const changes = [];
    const structures = ['castle', 'turret-i', 'turret-ii', 'turret-iii', 'turret-iv'];

    structures.forEach(structureId => {
        const currentAlliance = schedule[structureId][time];
        const prevAlliance = timeIndex > 0 ? schedule[structureId][timeSlots[timeIndex - 1]] : null;

        // Only include if there's a change from previous time slot
        if (currentAlliance !== prevAlliance) {
            // Only add if current is not null (something is assigned now)
            if (currentAlliance) {
                const verb = (prevAlliance === null || prevAlliance === 'FFA') ? 'holds' : 'takes';
                changes.push({
                    structure: structureId,
                    alliance: currentAlliance,
                    verb: verb,
                    isFFA: currentAlliance === 'FFA'
                });
            }
        }
    });

    return changes;
}

function splitIntoParts(events) {
    const parts = [];
    let currentPart = [];
    let currentLength = 0;

    events.forEach(event => {
        const eventText = formatEvent(event);
        const eventLength = eventText.length;

        if (currentLength + eventLength > 280 && currentPart.length > 0) {
            parts.push([...currentPart]);
            currentPart = [];
            currentLength = 0;
        }

        currentPart.push(event);
        currentLength += eventLength;
    });

    if (currentPart.length > 0) {
        parts.push(currentPart);
    }

    return parts;
}

function formatEvent(event) {
    const { time, changes } = event;
    const lines = [];

    // Separate FFA and regular alliances
    const allianceGroups = {};
    const ffaStructures = {
        castle: false,
        turrets: []
    };
    
    changes.forEach(change => {
        if (change.isFFA) {
            // Handle FFA
            if (change.structure === 'castle') {
                ffaStructures.castle = true;
            } else {
                const turretName = change.structure.replace('turret-', '').toUpperCase();
                ffaStructures.turrets.push(turretName);
            }
        } else {
            // Handle regular alliances
            if (!allianceGroups[change.alliance]) {
                allianceGroups[change.alliance] = {
                    castle: false,
                    turrets: [],
                    verb: change.verb
                };
            }

            if (change.structure === 'castle') {
                allianceGroups[change.alliance].castle = true;
            } else {
                const turretName = change.structure.replace('turret-', '').toUpperCase();
                allianceGroups[change.alliance].turrets.push(turretName);
            }
        }
    });

    // Format regular alliance output
    Object.keys(allianceGroups).forEach(allianceName => {
        const group = allianceGroups[allianceName];
        let line = `${time} – ${allianceName} ${group.verb}`;

        if (group.castle && group.turrets.length > 0) {
            const turretList = group.turrets.join(', ');
            line += ` Castle + Turret${group.turrets.length > 1 ? 's' : ''} ${turretList}`;
        } else if (group.castle) {
            line += ' Castle';
        } else if (group.turrets.length > 0) {
            const turretList = group.turrets.join(', ');
            line += ` Turret${group.turrets.length > 1 ? 's' : ''} ${turretList}`;
        }

        lines.push(line);
    });

    // Format FFA output
    if (ffaStructures.castle && ffaStructures.turrets.length > 0) {
        // Castle and turrets FFA
        const turretList = ffaStructures.turrets.join(', ');
        lines.push(`${time} – Castle + Turret${ffaStructures.turrets.length > 1 ? 's' : ''} ${turretList} FFA`);
    } else if (ffaStructures.castle) {
        lines.push(`${time} – Castle FFA`);
    } else if (ffaStructures.turrets.length > 0) {
        const turretList = ffaStructures.turrets.join(', ');
        lines.push(`${time} – Turret${ffaStructures.turrets.length > 1 ? 's' : ''} ${turretList} FFA`);
    }

    return lines.join('\n');
}

function renderOutput(parts) {
    const container = document.getElementById('output-parts');
    
    if (parts.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No events scheduled</p>';
        return;
    }

    container.innerHTML = parts.map((part, index) => {
        const partText = part.map(event => formatEvent(event)).join('\n');
        
        return `
            <div class="output-part">
                <div class="output-part-header">
                    <strong>Part ${index + 1}</strong>
                    <button class="btn-secondary" onclick="copyPart(${index})">Copy Part ${index + 1}</button>
                </div>
                <div class="output-part-content">${partText}</div>
            </div>
        `;
    }).join('');
}

function copyPart(partIndex) {
    const partElement = document.querySelectorAll('.output-part-content')[partIndex];
    const text = partElement.textContent;
    
    navigator.clipboard.writeText(`Part ${partIndex + 1}\n${text}`).then(() => {
        alert(`Part ${partIndex + 1} copied to clipboard!`);
    });
}

function copyAllParts() {
    const parts = document.querySelectorAll('.output-part-content');
    const allText = Array.from(parts).map((part, index) => 
        `Part ${index + 1}\n${part.textContent}`
    ).join('\n\n');

    navigator.clipboard.writeText(allText).then(() => {
        alert('All parts copied to clipboard!');
    });
}

// Utility Functions
function getAllianceById(name) {
    return alliances.find(a => a.name === name);
}

function getContrastColor(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
}

function darkenColor(hexColor) {
    const r = Math.max(0, parseInt(hexColor.substr(1, 2), 16) - 40);
    const g = Math.max(0, parseInt(hexColor.substr(3, 2), 16) - 40);
    const b = Math.max(0, parseInt(hexColor.substr(5, 2), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Import/Export
function loadExampleSchedule() {
    if (confirm('Load the example schedule? This will replace your current schedule.')) {
        alliances = JSON.parse(JSON.stringify(defaultSchedule.alliances));
        schedule = JSON.parse(JSON.stringify(defaultSchedule.schedule));
        renderAlliances();
        generateTimeline();
        saveToLocalStorage();
        updateVisualMap(0);
        alert('Example schedule loaded! Click "Generate Schedule" to see the output.');
    }
}

function exportSchedule() {
    const data = {
        alliances: alliances,
        schedule: schedule
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'castle-schedule.json';
    a.click();
}

function importSchedule() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                alliances = data.alliances;
                schedule = data.schedule;
                renderAlliances();
                generateTimeline();
                saveToLocalStorage();
                alert('Schedule imported successfully!');
            } catch (error) {
                alert('Error importing schedule: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Share Link Generation
function generateShareLink() {
    // Check if there's any data to share
    if (alliances.length === 0) {
        alert('Please add at least one alliance before generating a share link.');
        return;
    }
    
    // Check if there's any schedule data
    const hasScheduleData = Object.keys(schedule).some(structure => 
        Object.keys(schedule[structure]).length > 0
    );
    
    if (!hasScheduleData) {
        alert('Please create a schedule before generating a share link. Click on timeline cells to assign alliances.');
        return;
    }
    
    const data = {
        alliances: alliances,
        schedule: schedule
    };
    
    // Compress the data by shortening keys
    const compressedData = {
        a: data.alliances.map(a => ({
            n: a.name,
            c: a.color.replace('#', ''), // Remove # to save chars
            f: a.isFFA ? 1 : 0
        })),
        s: {}
    };
    
    // Compress schedule keys and time format
    const structureMap = {
        'castle': 'c',
        'turret-i': '1',
        'turret-ii': '2',
        'turret-iii': '3',
        'turret-iv': '4'
    };
    
    Object.keys(data.schedule).forEach(key => {
        const times = data.schedule[key];
        const compressedTimes = {};
        Object.keys(times).forEach(time => {
            // Compress time: "12:00" -> "1200"
            const shortTime = time.replace(':', '');
            compressedTimes[shortTime] = times[time];
        });
        compressedData.s[structureMap[key]] = compressedTimes;
    });
    
    // Use LZString to compress and make URL-safe
    const jsonStr = JSON.stringify(compressedData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    
    // Create URL with the current page location
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?d=${compressed}`;
    
    // Check if URL is too long
    if (shareUrl.length > 8000) {
        alert('Schedule is too complex for URL sharing. Please use Export JSON instead.');
        return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Share link copied to clipboard!\n\nLink length: ${shareUrl.length} characters\n\nAnyone with this link will see your schedule instantly.`);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Share link copied to clipboard!\n\nLink length: ${shareUrl.length} characters\n\nAnyone with this link will see your schedule instantly.`);
    });
}

function exportTimelineAsImage() {
    const timelineTable = document.getElementById('timeline-table');
    const timelineGrid = document.querySelector('.timeline-grid');
    
    // Show loading message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳ Generating...';
    button.disabled = true;
    
    // Temporarily remove scroll and show full width
    const originalOverflow = timelineGrid.style.overflow;
    const originalMaxWidth = timelineGrid.style.maxWidth;
    timelineGrid.style.overflow = 'visible';
    timelineGrid.style.maxWidth = 'none';
    
    // Use html2canvas to capture just the table
    html2canvas(timelineTable, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: timelineTable.scrollWidth,
        windowHeight: timelineTable.scrollHeight,
        width: timelineTable.scrollWidth,
        height: timelineTable.scrollHeight
    }).then(canvas => {
        // Restore original styles
        timelineGrid.style.overflow = originalOverflow;
        timelineGrid.style.maxWidth = originalMaxWidth;
        
        // Convert to blob and download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'castle-battle-schedule.png';
            a.click();
            URL.revokeObjectURL(url);
            
            // Reset button
            button.textContent = originalText;
            button.disabled = false;
        });
    }).catch(error => {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again.');
        
        // Restore original styles
        timelineGrid.style.overflow = originalOverflow;
        timelineGrid.style.maxWidth = originalMaxWidth;
        
        button.textContent = originalText;
        button.disabled = false;
    });
}

function clearSchedule() {
    if (confirm('Clear all schedule assignments? Your alliances will be kept.')) {
        schedule = {
            castle: {},
            'turret-i': {},
            'turret-ii': {},
            'turret-iii': {},
            'turret-iv': {}
        };
        generateTimeline();
        saveToLocalStorage();
        document.getElementById('output-parts').innerHTML = '<p style="text-align: center; opacity: 0.7;">Click "Generate Schedule" to create the battle plan</p>';
        updateVisualMap(0);
    }
}

// Info Modal Functions
const infoContent = {
    alliances: {
        title: "📋 Alliance Management",
        content: `
            <p>This section is where you manage all the alliances participating in the castle battle.</p>
            <ul>
                <li><strong>Add Alliance:</strong> Enter the alliance name (e.g., FTP, WUW, 686) and select a color to represent them</li>
                <li><strong>Add FFA:</strong> Click to add a "Free-For-All" option for time slots that aren't assigned to any specific alliance</li>
                <li><strong>Edit Alliance:</strong> Click on any alliance tag to change its name or color</li>
                <li><strong>Remove Alliance:</strong> Click the × button on an alliance tag to remove it</li>
            </ul>
            <p><strong>Tip:</strong> Choose distinct colors for each alliance to make the timeline easy to read!</p>
        `
    },
    castle: {
        title: "🏰 Castle Battle Map",
        content: `
            <p>This visual map shows which alliance controls each structure at different times during the battle.</p>
            <ul>
                <li><strong>Castle (Diamond):</strong> The main castle structure in the center</li>
                <li><strong>Turrets I-IV (Circles):</strong> The four turret positions around the castle</li>
                <li><strong>Preview Slider:</strong> Drag the slider to see who controls what at different times</li>
                <li><strong>Color Changes:</strong> Structures change color based on which alliance is scheduled to control them</li>
            </ul>
            <p><strong>Tip:</strong> Use this to quickly visualize your battle plan and spot any gaps in coverage!</p>
        `
    },
    timeline: {
        title: "⏰ Timeline & Schedule Builder",
        content: `
            <p>The timeline grid is where you build your battle schedule by assigning structures to alliances.</p>
            <ul>
                <li><strong>Time Interval:</strong> Choose 15, 30, or 60 minute intervals for your schedule</li>
                <li><strong>Click to Assign:</strong> Click any cell in the grid to assign that structure to an alliance for that time period</li>
                <li><strong>Time Ranges:</strong> Each column shows "Start to End" times (e.g., 12:00 to 12:30)</li>
                <li><strong>Total Time Stats:</strong> See how much time each alliance gets on the castle and turrets</li>
                <li><strong>Export as Image:</strong> Download the timeline as a PNG to share on Discord</li>
            </ul>
            <p><strong>Note:</strong> The time shown is when control STARTS. MYS at 12:00 means they control it from 12:00 until the next assignment.</p>
        `
    },
    output: {
        title: "📝 Generated Schedule Output",
        content: `
            <p>This section generates formatted text from your schedule that you can copy and paste into Kingshot's in-game chat.</p>
            <ul>
                <li><strong>Generate Schedule:</strong> Click to create formatted battle plan text from your timeline</li>
                <li><strong>Copy Parts:</strong> The output is split into parts to fit Kingshot's chat message limits - copy each part separately</li>
                <li><strong>Copy All:</strong> Copy all parts at once to paste into Discord or other apps</li>
                <li><strong>Share Link:</strong> Generate a URL that anyone can open to see your exact schedule</li>
                <li><strong>Export/Import JSON:</strong> Save your schedule as a file or load someone else's schedule</li>
                <li><strong>Clear Schedule:</strong> Remove all assignments but keep your alliances</li>
            </ul>
            <p><strong>Tip:</strong> Use Share Link for the fastest way to collaborate with your alliance!</p>
        `
    }
};

function openInfoModal(section) {
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('info-title');
    const content = document.getElementById('info-content');
    
    if (infoContent[section]) {
        title.textContent = infoContent[section].title;
        content.innerHTML = infoContent[section].content;
        modal.style.display = 'flex';
    }
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// Close info modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('info-modal');
    if (event.target === modal) {
        closeInfoModal();
    }
});

