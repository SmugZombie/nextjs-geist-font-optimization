class StreamDeckApp {
    constructor() {
        this.connection = null;
        this.hubConnection = null;
        this.currentLayout = '4x4';
        this.currentPage = 'page1';
        this.buttons = [];
        
        this.init();
    }

    async init() {
        this.setupSignalR();
        this.setupEventListeners();
        this.loadPages();
    }

    setupSignalR() {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl("/dashboardhub")
            .build();

        this.hubConnection.on("UpdateSystemInfo", (systemInfo) => {
            this.updateSystemInfo(systemInfo);
        });

        this.hubConnection.on("ReceiveButtonFeedback", (buttonId, status, message) => {
            this.updateButtonFeedback(buttonId, status, message);
        });

        this.hubConnection.start()
            .then(() => {
                console.log("SignalR Connected");
                this.updateConnectionStatus("Connected");
            })
            .catch(err => {
                console.error("SignalR Connection Error: ", err);
                this.updateConnectionStatus("Disconnected");
            });
    }

    setupEventListeners() {
        // Layout buttons
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setLayout(e.target.dataset.layout);
                this.updateLayoutButtons(e.target);
            });
        });

        // Page selector
        document.getElementById('page-selector').addEventListener('change', (e) => {
            this.currentPage = e.target.value;
            this.loadButtons();
        });
    }

    async loadPages() {
        try {
            const response = await fetch('/api/api/pages');
            const pages = await response.json();
            
            const selector = document.getElementById('page-selector');
            selector.innerHTML = '';
            
            pages.forEach(page => {
                const option = document.createElement('option');
                option.value = page.id;
                option.textContent = page.name;
                selector.appendChild(option);
            });
            
            this.loadButtons();
        } catch (error) {
            console.error('Error loading pages:', error);
        }
    }

    async loadButtons() {
        this.generateSampleButtons();
    }

    generateSampleButtons() {
        const grid = document.getElementById('button-grid');
        const [rows, cols] = this.currentLayout.split('x').map(Number);
        
        grid.innerHTML = '';
        grid.className = `button-grid grid-cols-${cols}`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const button = this.createButton(row, col);
                grid.appendChild(button);
            }
        }
    }

    createButton(row, col) {
        const button = document.createElement('div');
        button.className = 'grid-button';
        button.dataset.row = row;
        button.dataset.col = col;
        button.dataset.buttonId = `btn-${row}-${col}`;
        
        const buttonConfigs = {
            '0-0': { label: 'START', type: 'keyboard', value: 'CTRL+SHIFT+S', color: '#00ff00' },
            '0-1': { label: 'STOP', type: 'keyboard', value: 'CTRL+SHIFT+Q', color: '#ff0000' },
            '0-2': { label: 'MUTE', type: 'keyboard', value: 'CTRL+M', color: '#ffff00' },
            '0-3': { label: 'SCREENSHOT', type: 'keyboard', value: 'PRTSC', color: '#00ffff' },
            '1-0': { label: 'CHROME', type: 'application', value: 'chrome.exe', color: '#4285f4' },
            '1-1': { label: 'DISCORD', type: 'application', value: 'discord.exe', color: '#7289da' },
            '1-2': { label: 'SPOTIFY', type: 'application', value: 'spotify.exe', color: '#1db954' },
            '1-3': { label: 'NOTEPAD', type: 'application', value: 'notepad.exe', color: '#ffffff' },
            '2-0': { label: 'CPU', type: 'widget', widget: 'cpu', color: '#00ff00' },
            '2-1': { label: 'RAM', type: 'widget', widget: 'memory', color: '#ff00ff' },
            '2-2': { label: 'GPU', type: 'widget', widget: 'gpu', color: '#00ffff' },
            '2-3': { label: 'NET', type: 'widget', widget: 'network', color: '#ffff00' }
        };
        
        const config = buttonConfigs[`${row}-${col}`];
        if (config) {
            button.textContent = config.label;
            button.style.borderColor = config.color;
            button.dataset.type = config.type;
            button.dataset.value = config.value;
            button.dataset.widget = config.widget || '';
            
            if (config.type === 'widget') {
                button.classList.add('widget');
                button.innerHTML = `
                    <div class="text-xs">${config.label}</div>
                    <div class="text-lg font-bold" id="widget-${config.widget}">0%</div>
                `;
            }
        } else {
            button.textContent = `${row}-${col}`;
        }
        
        button.addEventListener('click', () => this.handleButtonClick(button));
        
        return button;
    }

    async handleButtonClick(button) {
        const buttonId = button.dataset.buttonId;
        const type = button.dataset.type;
        const value = button.dataset.value;
        
        if (type === 'widget') return;
        
        button.classList.add('pulse');
        setTimeout(() => button.classList.remove('pulse'), 1000);
        
        try {
            const response = await fetch('/api/api/execute-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: buttonId,
                    actionType: type,
                    actionValue: value
                })
            });
            
            const result = await response.json();
            console.log('Action executed:', result);
        } catch (error) {
            console.error('Error executing action:', error);
        }
    }

    setLayout(layout) {
        this.currentLayout = layout;
        this.generateSampleButtons();
    }

    updateLayoutButtons(activeBtn) {
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('border-neon-magenta');
            btn.classList.add('border-gray-600');
        });
        activeBtn.classList.add('border-neon-magenta');
        activeBtn.classList.remove('border-gray-600');
    }

    updateConnectionStatus(status) {
        document.getElementById('connection-status').textContent = status;
    }

    updateSystemInfo(systemInfo) {
        const info = document.getElementById('system-info');
        info.textContent = `CPU: ${systemInfo.cpuUsage}% | RAM: ${systemInfo.memoryUsage}%`;
        
        // Update widget values
        if (document.getElementById('widget-cpu')) {
            document.getElementById('widget-cpu').textContent = `${systemInfo.cpuUsage}%`;
        }
        if (document.getElementById('widget-memory')) {
            document.getElementById('widget-memory').textContent = `${systemInfo.memoryUsage}%`;
        }
        if (document.getElementById('widget-gpu')) {
            document.getElementById('widget-gpu').textContent = `${systemInfo.gpuUsage}%`;
        }
    }

    updateButtonFeedback(buttonId, status, message) {
        const button = document.querySelector(`[data-button-id="${buttonId}"]`);
        if (button) {
            button.classList.toggle('status-active', status === 'success');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StreamDeckApp();
});
