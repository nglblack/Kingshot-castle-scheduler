class TerritoryPlanner {
    constructor() {
        this.canvas = document.getElementById('territory-grid');
        this.ctx = this.canvas.getContext('2d');
        this.canvasContainer = this.canvas.parentElement; // Set immediately
        this.gridSize = 20;
        this.gridWidth = 80;
        this.gridHeight = 80;
        this.maxGridWidth = 500;
        this.maxGridHeight = 500;
        
        // Set initial canvas size
        this.updateCanvasSize();
        
        this.currentTool = 'select';
        this.placedItems = [];
        this.selectedItem = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.townCenterCount = 0;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        
        // Pinch zoom for mobile
        this.isPinching = false;
        this.lastPinchDistance = 0;
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 3;
        
        // Undo/Redo history
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        this.colors = {
            allianceTerritory: '#3498db',
            buildableArea: '#2ecc71',
            validPlacement: 'rgba(46, 204, 113, 0.8)',
            invalidPlacement: 'rgba(231, 76, 60, 0.8)',
            pitfall: '#8b4513',
            townCenter: ['#ff6b6b', '#4ecdc4', '#ffd93d', '#a8e6cf', '#ff8b94', '#b4a7d6'],
            banner: '#ffd93d',
            mill: '#4ecdc4',
            allianceHQ: '#9b59b6',
            blockedPath: '#95a5a6',
            blockedPath2: '#6c757d',
            grid: '#e0e0e0',
            selectedOutline: '#3498db'
        };
        
        this.initializeEventListeners();
        this.redraw(); // Use redraw instead of just drawGrid
        this.loadFromURL(); // Load layout from URL if present
        this.saveHistory(); // Save initial state
    }
    
    initializeEventListeners() {
        // Tool selection - both action tools and building menu buttons
        document.querySelectorAll('.action-tool-btn, .building-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) {
                    this.selectTool(tool);
                    // Close buildings menu after selection
                    if (e.currentTarget.classList.contains('building-menu-btn')) {
                        this.closeBuildingsMenu();
                    }
                }
            });
        });
        
        // Buildings menu toggle
        const buildingsMenuBtn = document.getElementById('buildingsMenuBtn');
        const buildingsMenu = document.getElementById('buildingsMenu');
        
        if (buildingsMenuBtn && buildingsMenu) {
            buildingsMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                buildingsMenu.classList.toggle('show');
                buildingsMenuBtn.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!buildingsMenu.contains(e.target) && e.target !== buildingsMenuBtn) {
                    this.closeBuildingsMenu();
                }
            });
        }
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Button events
        document.getElementById('clear-grid').addEventListener('click', () => this.clearGrid());
        document.getElementById('export-png').addEventListener('click', () => this.exportPNG());
        document.getElementById('share-link').addEventListener('click', () => this.showShareModal());
        document.getElementById('export-json').addEventListener('click', () => this.showExportModal());
        document.getElementById('import-json').addEventListener('click', () => this.showImportModal());
        document.getElementById('sample-layouts').addEventListener('click', () => this.showSamplesModal());
        document.getElementById('resize-grid').addEventListener('click', () => this.resizeGrid());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Modal events
        this.initializeModalEvents();
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window resize event to maintain responsive layout
        window.addEventListener('resize', () => {
            // Debounce resize to avoid too many redraws
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updateCanvasSize();
            }, 250);
        });
    }
    
    initializeModalEvents() {
        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Import modal
        document.getElementById('import-confirm').addEventListener('click', () => this.importLayout());
        document.getElementById('import-cancel').addEventListener('click', () => {
            document.getElementById('import-modal').style.display = 'none';
        });
        
        // Export modal
        document.getElementById('download-json').addEventListener('click', () => this.downloadJSON());
        document.getElementById('copy-export').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('export-close').addEventListener('click', () => {
            document.getElementById('export-modal').style.display = 'none';
        });
        
        // Samples modal
        document.getElementById('samples-close').addEventListener('click', () => {
            document.getElementById('samples-modal').style.display = 'none';
        });
        
        // Share modal
        document.getElementById('copy-share-link').addEventListener('click', () => this.copyShareLink());
        document.getElementById('share-close').addEventListener('click', () => {
            document.getElementById('share-modal').style.display = 'none';
        });
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        this.selectedItem = null;
        
        // Update cursor based on tool
        if (tool === 'pan') {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
        
        // Update UI - remove active from all buttons
        document.querySelectorAll('.action-tool-btn, .building-menu-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active to selected button
        const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        this.redraw();
    }
    
    closeBuildingsMenu() {
        const menu = document.getElementById('buildingsMenu');
        const btn = document.getElementById('buildingsMenuBtn');
        if (menu) menu.classList.remove('show');
        if (btn) btn.classList.remove('active');
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvasContainer ? this.canvasContainer.getBoundingClientRect() : rect;
        
        // Calculate relative position within the container
        const relativeX = e.clientX - containerRect.left;
        const relativeY = e.clientY - containerRect.top;
        
        // Add scroll offset to get actual canvas position
        const scrollLeft = this.canvasContainer ? this.canvasContainer.scrollLeft : 0;
        const scrollTop = this.canvasContainer ? this.canvasContainer.scrollTop : 0;
        
        return {
            x: relativeX + scrollLeft,
            y: relativeY + scrollTop
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvasContainer ? this.canvasContainer.getBoundingClientRect() : rect;
        
        // Calculate relative position within the container
        const relativeX = e.touches[0].clientX - containerRect.left;
        const relativeY = e.touches[0].clientY - containerRect.top;
        
        // Add scroll offset to get actual canvas position
        const scrollLeft = this.canvasContainer ? this.canvasContainer.scrollLeft : 0;
        const scrollTop = this.canvasContainer ? this.canvasContainer.scrollTop : 0;
        
        return {
            x: relativeX + scrollLeft,
            y: relativeY + scrollTop
        };
    }
    
    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    screenToGrid(screenX, screenY) {
        return {
            x: Math.floor(screenX / this.gridSize),
            y: Math.floor(screenY / this.gridSize)
        };
    }
    
    gridToScreen(gridX, gridY) {
        return {
            x: gridX * this.gridSize,
            y: gridY * this.gridSize
        };
    }
    
    handleMouseDown(e) {
        if (this.currentTool === 'pan') {
            this.isPanning = true;
            this.panStart = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: this.canvasContainer ? this.canvasContainer.scrollLeft : 0,
                scrollTop: this.canvasContainer ? this.canvasContainer.scrollTop : 0
            };
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        const pos = this.getMousePos(e);
        const gridPos = this.screenToGrid(pos.x, pos.y);
        
        if (this.currentTool === 'select') {
            this.handleSelect(gridPos, pos);
        } else if (this.currentTool === 'delete') {
            this.handleDelete(gridPos);
        } else {
            this.handlePlace(gridPos);
        }
    }
    
    handleMouseMove(e) {
        if (this.isPanning) {
            if (this.canvasContainer) {
                const deltaX = e.clientX - this.panStart.x;
                const deltaY = e.clientY - this.panStart.y;
                this.canvasContainer.scrollLeft = this.panStart.scrollLeft - deltaX;
                this.canvasContainer.scrollTop = this.panStart.scrollTop - deltaY;
            }
            return;
        }
        
        const pos = this.getMousePos(e);
        const gridPos = this.screenToGrid(pos.x, pos.y);
        
        if (this.isDragging && this.selectedItem) {
            this.selectedItem.x = gridPos.x - this.dragOffset.x;
            this.selectedItem.y = gridPos.y - this.dragOffset.y;
            this.redraw();
        }
    }
    
    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.currentTool === 'pan' ? 'grab' : 'crosshair';
        }
        
        if (this.isDragging) {
            this.isDragging = false;
            this.validateItemPlacement(this.selectedItem);
            this.saveHistory(); // Save after moving item
            this.redraw();
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        // Check for pinch zoom (2 fingers)
        if (e.touches.length === 2) {
            this.isPinching = true;
            this.lastPinchDistance = this.getPinchDistance(e.touches);
            return;
        }
        
        // Single finger touch
        if (this.currentTool === 'pan') {
            this.isPanning = true;
            this.panStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                scrollLeft: this.canvasContainer ? this.canvasContainer.scrollLeft : 0,
                scrollTop: this.canvasContainer ? this.canvasContainer.scrollTop : 0
            };
            return;
        }
        
        const pos = this.getTouchPos(e);
        const gridPos = this.screenToGrid(pos.x, pos.y);
        
        if (this.currentTool === 'select') {
            this.handleSelect(gridPos, pos);
        } else if (this.currentTool === 'delete') {
            this.handleDelete(gridPos);
        } else {
            this.handlePlace(gridPos);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        // Handle pinch zoom
        if (e.touches.length === 2 && this.isPinching) {
            const currentDistance = this.getPinchDistance(e.touches);
            const delta = currentDistance - this.lastPinchDistance;
            
            // Update scale
            const scaleChange = delta * 0.01;
            this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + scaleChange));
            
            // Apply scale to canvas
            this.canvas.style.transform = `scale(${this.scale})`;
            this.canvas.style.transformOrigin = 'top left';
            
            this.lastPinchDistance = currentDistance;
            return;
        }
        
        if (this.isPanning) {
            if (this.canvasContainer) {
                const deltaX = e.touches[0].clientX - this.panStart.x;
                const deltaY = e.touches[0].clientY - this.panStart.y;
                this.canvasContainer.scrollLeft = this.panStart.scrollLeft - deltaX;
                this.canvasContainer.scrollTop = this.panStart.scrollTop - deltaY;
            }
            return;
        }
        
        if (this.isDragging && this.selectedItem) {
            const pos = this.getTouchPos(e);
            const gridPos = this.screenToGrid(pos.x, pos.y);
            this.selectedItem.x = gridPos.x - this.dragOffset.x;
            this.selectedItem.y = gridPos.y - this.dragOffset.y;
            this.redraw();
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Reset pinch state
        if (this.isPinching) {
            this.isPinching = false;
            this.lastPinchDistance = 0;
        }
        
        if (this.isPanning) {
            this.isPanning = false;
        }
        this.handleMouseUp(e);
    }
    
    handleKeyDown(e) {
        // Undo/Redo shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        } else if (e.key === 'Delete' && this.selectedItem) {
            this.deleteItem(this.selectedItem);
        } else if (e.key === 'Escape') {
            this.selectedItem = null;
            this.redraw();
        }
    }
    
    handleSelect(gridPos, screenPos) {
        const clickedItem = this.getItemAt(gridPos.x, gridPos.y);
        
        if (clickedItem) {
            this.selectedItem = clickedItem;
            this.isDragging = true;
            this.dragOffset = {
                x: gridPos.x - clickedItem.x,
                y: gridPos.y - clickedItem.y
            };
        } else {
            this.selectedItem = null;
        }
        
        this.redraw();
    }
    
    handleDelete(gridPos) {
        const item = this.getItemAt(gridPos.x, gridPos.y);
        if (item) {
            this.deleteItem(item);
        }
    }
    
    handlePlace(gridPos) {
        if (this.canPlaceItem(this.currentTool, gridPos.x, gridPos.y)) {
            this.placeItem(this.currentTool, gridPos.x, gridPos.y);
        }
    }
    
    getItemAt(x, y) {
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const size = this.getItemSize(item.type);
            
            if (x >= item.x && x < item.x + size.width &&
                y >= item.y && y < item.y + size.height) {
                return item;
            }
        }
        return null;
    }
    
    getItemSize(type) {
        const sizes = {
            pitfall: { width: 3, height: 3 },
            townCenter: { width: 2, height: 2 },
            banner: { width: 1, height: 1 },
            mill: { width: 2, height: 2 },
            allianceHQ: { width: 3, height: 3 },
            blockedPath1: { width: 1, height: 1 },
            blockedPath2: { width: 2, height: 2 }
        };
        return sizes[type] || { width: 1, height: 1 };
    }
    
    canPlaceItem(type, x, y) {
        const size = this.getItemSize(type);
        
        // Check bounds
        if (x < 0 || y < 0 || x + size.width > this.gridWidth || y + size.height > this.gridHeight) {
            return false;
        }
        
        // Check overlap with existing items
        for (const item of this.placedItems) {
            if (this.itemsOverlap(item, { type, x, y })) {
                return false;
            }
        }
        
        return true;
    }
    
    itemsOverlap(item1, item2) {
        const size1 = this.getItemSize(item1.type);
        const size2 = this.getItemSize(item2.type);
        
        return !(item1.x + size1.width <= item2.x ||
                item2.x + size2.width <= item1.x ||
                item1.y + size1.height <= item2.y ||
                item2.y + size2.height <= item1.y);
    }
    
    placeItem(type, x, y) {
        const item = { type, x, y, id: Date.now() };
        
        if (type === 'townCenter') {
            this.townCenterCount++;
            item.number = this.townCenterCount;
            item.color = this.colors.townCenter[(this.townCenterCount - 1) % this.colors.townCenter.length];
        }
        
        this.placedItems.push(item);
        this.saveHistory();
        this.redraw();
    }
    
    deleteItem(item) {
        const index = this.placedItems.indexOf(item);
        if (index > -1) {
            this.placedItems.splice(index, 1);
            
            // Renumber town centers
            if (item.type === 'townCenter') {
                this.renumberTownCenters();
            }
            
            this.selectedItem = null;
            this.saveHistory();
            this.redraw();
        }
    }
    
    renumberTownCenters() {
        const townCenters = this.placedItems.filter(item => item.type === 'townCenter');
        this.townCenterCount = townCenters.length;
        
        townCenters.forEach((tc, index) => {
            tc.number = index + 1;
            tc.color = this.colors.townCenter[index % this.colors.townCenter.length];
        });
    }
    
    validateItemPlacement(item) {
        if (!item) return;
        
        // Ensure item stays within bounds
        const size = this.getItemSize(item.type);
        item.x = Math.max(0, Math.min(item.x, this.gridWidth - size.width));
        item.y = Math.max(0, Math.min(item.y, this.gridHeight - size.height));
        
        // Check for overlaps and prevent them
        const overlapping = this.placedItems.find(other => 
            other !== item && this.itemsOverlap(item, other)
        );
        
        if (overlapping) {
            // Move item to nearest valid position
            this.findValidPosition(item);
        }
    }
    
    findValidPosition(item) {
        const size = this.getItemSize(item.type);
        
        // Try positions in expanding spiral
        for (let radius = 1; radius < Math.max(this.gridWidth, this.gridHeight); radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const newX = item.x + dx;
                        const newY = item.y + dy;
                        
                        if (newX >= 0 && newY >= 0 && 
                            newX + size.width <= this.gridWidth && 
                            newY + size.height <= this.gridHeight) {
                            
                            const testItem = { ...item, x: newX, y: newY };
                            const hasOverlap = this.placedItems.some(other => 
                                other !== item && this.itemsOverlap(testItem, other)
                            );
                            
                            if (!hasOverlap) {
                                item.x = newX;
                                item.y = newY;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawTerritoryZones() {
        // Create a grid to track territory coverage
        const territoryGrid = Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(null));
        
        // Collect all territory-generating buildings
        const banners = this.placedItems.filter(item => item.type === 'banner');
        const allianceHQs = this.placedItems.filter(item => item.type === 'allianceHQ');
        
        // Process banners (3 tiles blue, 4 more tiles green)
        for (const banner of banners) {
            // Green zone first (buildable area) - 7 tiles in each direction
            for (let y = Math.max(0, banner.y - 7); y < Math.min(this.gridHeight, banner.y + 1 + 7); y++) {
                for (let x = Math.max(0, banner.x - 7); x < Math.min(this.gridWidth, banner.x + 1 + 7); x++) {
                    if (territoryGrid[y][x] !== 'blue') {
                        territoryGrid[y][x] = 'green';
                    }
                }
            }
            
            // Blue zone (alliance territory) - 3 tiles in each direction (overrides green)
            for (let y = Math.max(0, banner.y - 3); y < Math.min(this.gridHeight, banner.y + 1 + 3); y++) {
                for (let x = Math.max(0, banner.x - 3); x < Math.min(this.gridWidth, banner.x + 1 + 3); x++) {
                    territoryGrid[y][x] = 'blue';
                }
            }
        }
        
        // Process Alliance HQs (6 tiles blue, 4 more tiles green)
        for (const hq of allianceHQs) {
            // Green zone (buildable area) - 10 tiles in each direction (6+4)
            for (let y = Math.max(0, hq.y - 10); y < Math.min(this.gridHeight, hq.y + 3 + 10); y++) {
                for (let x = Math.max(0, hq.x - 10); x < Math.min(this.gridWidth, hq.x + 3 + 10); x++) {
                    if (territoryGrid[y][x] !== 'blue') {
                        territoryGrid[y][x] = 'green';
                    }
                }
            }
            
            // Blue zone (alliance territory) - 6 tiles in each direction (overrides green)
            for (let y = Math.max(0, hq.y - 6); y < Math.min(this.gridHeight, hq.y + 3 + 6); y++) {
                for (let x = Math.max(0, hq.x - 6); x < Math.min(this.gridWidth, hq.x + 3 + 6); x++) {
                    territoryGrid[y][x] = 'blue';
                }
            }
        }
        
        // Draw territory zones cell by cell with transparency to show grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (territoryGrid[y][x] === 'green') {
                    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'; // Semi-transparent green
                    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
                } else if (territoryGrid[y][x] === 'blue') {
                    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; // Semi-transparent blue
                    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
                }
            }
        }
    }
    
    drawItems() {
        for (const item of this.placedItems) {
            this.drawItem(item);
        }
    }
    
    drawItem(item) {
        const size = this.getItemSize(item.type);
        const x = item.x * this.gridSize;
        const y = item.y * this.gridSize;
        const width = size.width * this.gridSize;
        const height = size.height * this.gridSize;
        
        // Draw item background
        let fillColor;
        switch (item.type) {
            case 'pitfall':
                fillColor = this.colors.pitfall;
                break;
            case 'townCenter':
                fillColor = item.color;
                break;
            case 'banner':
                fillColor = this.colors.banner;
                break;
            case 'mill':
                fillColor = this.colors.mill;
                break;
            case 'allianceHQ':
                fillColor = this.colors.allianceHQ;
                break;
            case 'blockedPath1':
                fillColor = this.colors.blockedPath;
                break;
            case 'blockedPath2':
                fillColor = this.colors.blockedPath2;
                break;
        }
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, width, height);
        
        // Draw validation indicator for certain items
        if (['pitfall', 'townCenter', 'mill', 'allianceHQ'].includes(item.type)) {
            const isValid = this.isItemInAllianceTerritory(item);
            if (isValid) {
                // Stronger, more vibrant color with black border
                this.ctx.fillStyle = this.colors.validPlacement;
                this.ctx.fillRect(x + 2, y + 2, 12, 12);
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 2, y + 2, 12, 12);
            } else {
                this.ctx.fillStyle = this.colors.invalidPlacement;
                this.ctx.fillRect(x + 2, y + 2, 12, 12);
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 2, y + 2, 12, 12);
            }
        }
        
        // Draw border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw text labels for buildings
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let text = '';
        let fontSize = '12px';
        
        switch (item.type) {
            case 'pitfall':
                text = 'Pitfall';
                fontSize = size.width >= 3 ? '10px' : '8px';
                break;
            case 'townCenter':
                text = `TC#${item.number}`;
                fontSize = '12px';
                break;
            case 'banner':
                text = 'B';
                fontSize = '14px';
                break;
            case 'mill':
                text = 'AM';
                fontSize = '12px';
                break;
            case 'allianceHQ':
                text = 'HQ';
                fontSize = '14px';
                break;
        }
        
        if (text) {
            this.ctx.font = `bold ${fontSize} Arial`;
            // Draw text stroke (outline)
            this.ctx.strokeText(text, x + width/2, y + height/2);
            // Draw text fill
            this.ctx.fillText(text, x + width/2, y + height/2);
        }
        
        // Draw selection outline
        if (item === this.selectedItem) {
            this.ctx.strokeStyle = this.colors.selectedOutline;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
        }
    }
    
    isItemInAllianceTerritory(item) {
        const banners = this.placedItems.filter(banner => banner.type === 'banner');
        const allianceHQs = this.placedItems.filter(hq => hq.type === 'allianceHQ');
        const size = this.getItemSize(item.type);
        
        // Check each tile of the building to see if it's in blue territory
        for (let y = item.y; y < item.y + size.height; y++) {
            for (let x = item.x; x < item.x + size.width; x++) {
                let tileInBlueTerritory = false;
                
                // Check if this tile is in blue territory from any banner
                for (const banner of banners) {
                    const blueStartX = banner.x - 3;
                    const blueStartY = banner.y - 3;
                    const blueEndX = banner.x + 1 + 3;
                    const blueEndY = banner.y + 1 + 3;
                    
                    if (x >= blueStartX && x < blueEndX && y >= blueStartY && y < blueEndY) {
                        tileInBlueTerritory = true;
                        break;
                    }
                }
                
                // If not found in banner territory, check Alliance HQs
                if (!tileInBlueTerritory) {
                    for (const hq of allianceHQs) {
                        const blueStartX = hq.x - 6;
                        const blueStartY = hq.y - 6;
                        const blueEndX = hq.x + 3 + 6;
                        const blueEndY = hq.y + 3 + 6;
                        
                        if (x >= blueStartX && x < blueEndX && y >= blueStartY && y < blueEndY) {
                            tileInBlueTerritory = true;
                            break;
                        }
                    }
                }
                
                // If any tile is not in blue territory, the building is invalid
                if (!tileInBlueTerritory) {
                    return false;
                }
            }
        }
        
        // All tiles are in blue territory (from any combination of sources)
        return true;
    }
    
    updateCanvasSize() {
        // Set actual canvas size based on grid dimensions
        this.canvas.width = this.gridWidth * this.gridSize;
        this.canvas.height = this.gridHeight * this.gridSize;
        
        // Ensure container reference is current
        if (!this.canvasContainer) {
            this.canvasContainer = this.canvas.parentElement;
        }
        
        // Let the canvas container fill available space (CSS handles this with flex: 1)
        // Remove fixed dimensions to allow container to grow with available space
        if (this.canvasContainer) {
            this.canvasContainer.style.width = '';
            this.canvasContainer.style.height = '';
            this.canvasContainer.style.overflow = 'auto';
            this.canvasContainer.style.webkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
            
            // Center the view
            this.centerView();
        }
    }
    
    centerView() {
        if (!this.canvasContainer) {
            return;
        }
        
        // Try to find the Alliance HQ to center on it (only if placedItems exists)
        const hq = this.placedItems && this.placedItems.length > 0 
            ? this.placedItems.find(item => item.type === 'allianceHQ') 
            : null;
        
        if (hq) {
            // Center on the HQ
            const hqSize = this.getItemSize('allianceHQ');
            const hqCenterX = (hq.x + hqSize.width / 2) * this.gridSize;
            const hqCenterY = (hq.y + hqSize.height / 2) * this.gridSize;
            
            const containerWidth = this.canvasContainer.clientWidth || this.canvasContainer.offsetWidth;
            const containerHeight = this.canvasContainer.clientHeight || this.canvasContainer.offsetHeight;
            
            // Calculate scroll position to center the HQ
            this.canvasContainer.scrollLeft = Math.max(0, hqCenterX - (containerWidth / 2));
            this.canvasContainer.scrollTop = Math.max(0, hqCenterY - (containerHeight / 2));
        } else {
            // No HQ found, use default centering (center of grid)
            const containerWidth = this.canvasContainer.clientWidth || this.canvasContainer.offsetWidth;
            const containerHeight = this.canvasContainer.clientHeight || this.canvasContainer.offsetHeight;
            
            const scrollLeft = Math.max(0, (this.canvas.width - containerWidth) / 2);
            const scrollTop = Math.max(0, (this.canvas.height - containerHeight) / 2);
            
            this.canvasContainer.scrollLeft = scrollLeft;
            this.canvasContainer.scrollTop = scrollTop;
        }
    }
    
    getBuildingBounds() {
        if (this.placedItems.length === 0) {
            return null;
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const item of this.placedItems) {
            const size = this.getItemSize(item.type);
            minX = Math.min(minX, item.x);
            minY = Math.min(minY, item.y);
            maxX = Math.max(maxX, item.x + size.width);
            maxY = Math.max(maxY, item.y + size.height);
        }
        
        // Add some padding around the buildings
        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(this.gridWidth, maxX + padding);
        maxY = Math.min(this.gridHeight, maxY + padding);
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    redraw() {
        this.drawGrid();
        this.drawTerritoryZones();
        this.drawItems();
    }
    
    resizeGrid() {
        const newWidth = parseInt(document.getElementById('grid-width').value);
        const newHeight = parseInt(document.getElementById('grid-height').value);
        
        if (newWidth < 10 || newWidth > this.maxGridWidth || newHeight < 10 || newHeight > this.maxGridHeight) {
            alert(`Grid size must be between 10-${this.maxGridWidth} for width and 10-${this.maxGridHeight} for height`);
            return;
        }
        
        this.gridWidth = newWidth;
        this.gridHeight = newHeight;
        
        // Update canvas and container size
        this.updateCanvasSize();
        
        // Remove items that are now outside the grid
        this.placedItems = this.placedItems.filter(item => {
            const size = this.getItemSize(item.type);
            return item.x + size.width <= this.gridWidth && item.y + size.height <= this.gridHeight;
        });
        
        // Renumber town centers if any were removed
        this.renumberTownCenters();
        
        this.redraw();
    }
    
    clearGrid() {
        this.placedItems = [];
        this.selectedItem = null;
        this.townCenterCount = 0;
        this.centerView();
        this.redraw();
    }
    
    exportPNG() {
        const bounds = this.getBuildingBounds();
        
        if (!bounds) {
            alert('No buildings to export. Place some buildings first.');
            return;
        }
        
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        // Set canvas size to the building area
        const exportWidth = bounds.width * this.gridSize;
        const exportHeight = bounds.height * this.gridSize;
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        
        // Draw white background
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportWidth, exportHeight);
        
        // Calculate source region on the main canvas
        const sourceX = bounds.x * this.gridSize;
        const sourceY = bounds.y * this.gridSize;
        
        // Copy the relevant portion of the canvas
        exportCtx.drawImage(
            this.canvas,
            sourceX, sourceY, exportWidth, exportHeight,
            0, 0, exportWidth, exportHeight
        );
        
        // Create download link
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kingshot-territory-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    exportToText() {
        // Create compact representation
        const data = {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            items: this.placedItems.map(item => ({
                t: this.getTypeCode(item.type),
                x: item.x,
                y: item.y,
                ...(item.type === 'townCenter' ? { n: item.number } : {})
            }))
        };
        
        // Compress to base64
        const jsonStr = JSON.stringify(data);
        return btoa(jsonStr);
    }
    
    getTypeCode(type) {
        const codes = {
            pitfall: 'P',
            townCenter: 'T',
            banner: 'B',
            mill: 'M',
            allianceHQ: 'H',
            blockedPath1: 'X',
            blockedPath2: 'Y'
        };
        return codes[type] || type;
    }
    
    getTypeFromCode(code) {
        const types = {
            'P': 'pitfall',
            'T': 'townCenter',
            'B': 'banner',
            'M': 'mill',
            'H': 'allianceHQ',
            'X': 'blockedPath1',
            'Y': 'blockedPath2'
        };
        return types[code] || code;
    }
    
    importFromText(text) {
        try {
            let data;
            const trimmedText = text.trim();
            
            // Try to parse as direct JSON first (pretty format)
            try {
                data = JSON.parse(trimmedText);
            } catch (e) {
                // If that fails, try base64 decode then JSON parse (compressed format)
                const jsonStr = atob(trimmedText);
                data = JSON.parse(jsonStr);
            }
            
            this.clearGrid();
            
            // Update grid size if provided
            if (data.gridWidth && data.gridHeight) {
                this.gridWidth = data.gridWidth;
                this.gridHeight = data.gridHeight;
                this.canvas.width = this.gridWidth * this.gridSize;
                this.canvas.height = this.gridHeight * this.gridSize;
                
                // Update UI inputs
                document.getElementById('grid-width').value = this.gridWidth;
                document.getElementById('grid-height').value = this.gridHeight;
            }
            
            // Handle both formats: compressed (with codes) and pretty JSON (with full names)
            for (const itemData of data.items) {
                const item = {
                    type: itemData.type || this.getTypeFromCode(itemData.t), // Support both formats
                    x: itemData.x,
                    y: itemData.y,
                    id: Date.now() + Math.random()
                };
                
                if (item.type === 'townCenter') {
                    this.townCenterCount++;
                    item.number = itemData.number || this.townCenterCount; // Use stored number if available
                    item.color = itemData.color || this.colors.townCenter[(this.townCenterCount - 1) % this.colors.townCenter.length];
                }
                
                this.placedItems.push(item);
            }
            
            this.centerView();
            this.redraw();
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
    
    showExportModal() {
        const prettyJSON = this.exportToPrettyJSON();
        document.getElementById('export-text-area').value = prettyJSON;
        document.getElementById('export-modal').style.display = 'block';
    }
    
    exportToPrettyJSON() {
        // Create readable JSON with full property names
        const data = {
            version: "1.0",
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            createdAt: new Date().toISOString(),
            items: this.placedItems.map(item => ({
                type: item.type,
                x: item.x,
                y: item.y,
                ...(item.type === 'townCenter' ? { number: item.number, color: item.color } : {})
            }))
        };
        
        return JSON.stringify(data, null, 2); // Pretty print with 2-space indent
    }
    
    downloadJSON() {
        const jsonData = this.exportToPrettyJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.href = url;
        a.download = `kingshot-territory-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show feedback
        const button = document.getElementById('download-json');
        const originalText = button.textContent;
        button.textContent = 'Downloaded!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
    
    showImportModal() {
        document.getElementById('import-text-area').value = '';
        document.getElementById('import-modal').style.display = 'block';
    }
    
    showSamplesModal() {
        const samplesGrid = document.getElementById('sample-layouts-grid');
        samplesGrid.innerHTML = '';
        
        if (typeof sampleLayouts !== 'undefined' && sampleLayouts.length > 0) {
            sampleLayouts.forEach(sample => {
                const div = document.createElement('div');
                div.className = 'sample-layout-item';
                div.innerHTML = `
                    <h4>${sample.name}</h4>
                    <p>${sample.description}</p>
                `;
                div.addEventListener('click', () => {
                    if (this.importFromText(sample.code)) {
                        document.getElementById('samples-modal').style.display = 'none';
                    } else {
                        alert('Failed to import sample layout');
                    }
                });
                samplesGrid.appendChild(div);
            });
        } else {
            // Show message if no samples are available
            samplesGrid.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #8b7355;">
                    <h3>No Sample Layouts Available</h3>
                    <p>Make sure sample-layouts.js is loaded correctly.</p>
                    <p style="margin-top: 1rem; font-size: 0.9em;">
                        The file should be at: <code>assets/js/sample-layouts.js</code>
                    </p>
                </div>
            `;
            console.error('sampleLayouts not found. Check that sample-layouts.js is loaded.');
        }
        
        document.getElementById('samples-modal').style.display = 'block';
    }
    
    importLayout() {
        const text = document.getElementById('import-text-area').value;
        if (this.importFromText(text)) {
            document.getElementById('import-modal').style.display = 'none';
        } else {
            alert('Invalid layout code. Please check the format and try again.');
        }
    }
    
    copyToClipboard() {
        const textarea = document.getElementById('export-text-area');
        textarea.select();
        document.execCommand('copy');
        
        const button = document.getElementById('copy-export');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
    
    showShareModal() {
        const layoutData = this.exportToText();
        const compressed = LZString.compressToEncodedURIComponent(layoutData);
        const url = `${window.location.origin}${window.location.pathname}?layout=${compressed}`;
        
        document.getElementById('share-link-url').value = url;
        document.getElementById('share-modal').style.display = 'block';
    }
    
    copyShareLink() {
        const input = document.getElementById('share-link-url');
        input.select();
        document.execCommand('copy');
        
        const button = document.getElementById('copy-share-link');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
    
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const layoutParam = urlParams.get('layout');
        
        if (layoutParam) {
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(layoutParam);
                if (decompressed && this.importFromText(decompressed)) {
                    console.log('Layout loaded from URL successfully');
                } else {
                    console.error('Failed to load layout from URL');
                }
            } catch (error) {
                console.error('Error loading layout from URL:', error);
            }
        }
    }
    
    // Undo/Redo History Management
    saveHistory() {
        // Remove any history after current index (when user makes change after undoing)
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        const state = {
            items: JSON.parse(JSON.stringify(this.placedItems)),
            townCenterCount: this.townCenterCount
        };
        
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateHistoryButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }
    
    restoreState(state) {
        this.placedItems = JSON.parse(JSON.stringify(state.items));
        this.townCenterCount = state.townCenterCount;
        this.selectedItem = null;
        this.updateHistoryButtons();
        this.redraw();
    }
    
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const planner = new TerritoryPlanner();
    
    // Make planner available globally for debugging
    window.territoryPlanner = planner;
    
    // Grid Controls Info button handler
    const gridInfoBtn = document.getElementById('gridInfoBtn');
    const gridInfoModal = document.getElementById('grid-info-modal');
    const gridInfoClose = document.getElementById('grid-info-close');
    
    if (gridInfoBtn && gridInfoModal) {
        gridInfoBtn.addEventListener('click', () => {
            gridInfoModal.style.display = 'flex';
        });
        
        if (gridInfoClose) {
            gridInfoClose.addEventListener('click', () => {
                gridInfoModal.style.display = 'none';
            });
        }
        
        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === gridInfoModal) {
                gridInfoModal.style.display = 'none';
            }
        });
    }
    
    // Territory Map Info button handler
    const mapInfoBtn = document.getElementById('mapInfoBtn');
    const mapInfoModal = document.getElementById('map-info-modal');
    const mapInfoClose = document.getElementById('map-info-close');
    
    if (mapInfoBtn && mapInfoModal) {
        mapInfoBtn.addEventListener('click', () => {
            mapInfoModal.style.display = 'flex';
        });
        
        if (mapInfoClose) {
            mapInfoClose.addEventListener('click', () => {
                mapInfoModal.style.display = 'none';
            });
        }
        
        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === mapInfoModal) {
                mapInfoModal.style.display = 'none';
            }
        });
    }
    
    // Mobile navigation menu toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
});
