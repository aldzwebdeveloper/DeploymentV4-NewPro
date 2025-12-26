
// DOM Elements
const deployForm = document.getElementById('deployForm');
const siteNameInput = document.getElementById('siteName');
const fileTypeSelect = document.getElementById('fileType');
const fileInput = document.getElementById('htmlFile');
const fileInputCustom = document.getElementById('fileInputCustom');
const fileName = document.getElementById('fileName');
const fileInfo = document.getElementById('fileInfo');
const fileCount = document.getElementById('fileCount');
const fileList = document.getElementById('fileList');
const deployBtn = document.getElementById('deployBtn');
const spinner = document.getElementById('spinner');
const consoleOutput = document.getElementById('consoleOutput');
const resultPanel = document.getElementById('resultPanel');
const resultMessage = document.getElementById('resultMessage');
const infoPanel = document.getElementById('infoPanel');
const websiteUrl = document.getElementById('websiteUrl');
const visitLink = document.getElementById('visitLink');
const copyUrlBtn = document.getElementById('copyUrl');
const totalDeployments = document.getElementById('totalDeployments');
const successDeployments = document.getElementById('successDeployments');
const failedDeployments = document.getElementById('failedDeployments');
const currentYear = document.getElementById('currentYear');

// Variables
let selectedFiles = [];
const deploymentStats = {
    total: 0,
    success: 0,
    failed: 0
};

// File type configurations
const fileTypeConfigs = {
    'html': {
        accept: '.html',
        multiple: false,
        allowedExtensions: ['.html', '.htm'],
        description: 'HTML files only'
    },
    'zip': {
        accept: '.zip',
        multiple: false,
        allowedExtensions: ['.zip'],
        description: 'ZIP archives only'
    },
    'js': {
        accept: '.js',
        multiple: false,
        allowedExtensions: ['.js'],
        description: 'JavaScript files only'
    },
    'css': {
        accept: '.css',
        multiple: false,
        allowedExtensions: ['.css'],
        description: 'CSS files only'
    },
    'multiple': {
        accept: '.html,.js,.css,.png,.jpg,.jpeg,.gif,.txt,.json',
        multiple: true,
        allowedExtensions: ['.html', '.htm', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.json'],
        description: 'Multiple web files allowed'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Initialize stats display
    updateStatsDisplay();
    
    // Initialize console
    addToConsole('$ Website Deployment Interface initialized');
    addToConsole('$ Ready to process file uploads');
    
    // Initialize file input with default type
    updateFileInputConfig();
});

// Update file input configuration based on selected file type
function updateFileInputConfig() {
    const fileType = fileTypeSelect.value;
    const config = fileTypeConfigs[fileType];
    
    fileInput.accept = config.accept;
    fileInput.multiple = config.multiple;
    
    // Update file upload area hint
    const fileHint = fileInputCustom.querySelector('.file-hint');
    if (fileHint) {
        fileHint.textContent = config.description + (config.multiple ? ' (drag and drop supported)' : '');
    }
}

// Event listener for file type selector
fileTypeSelect.addEventListener('change', function() {
    const fileType = this.value;
    
    // Update file input configuration
    updateFileInputConfig();
    
    // Reset file input
    fileInput.value = '';
    fileName.textContent = 'Choose a file';
    fileInputCustom.classList.remove('has-file');
    selectedFiles = [];
    updateFileInfo();
    
    addToConsole(`$ File type changed to: ${fileType.toUpperCase()}`);
    addToConsole(`$ ${fileTypeConfigs[fileType].description}`);
});

// Validate file against selected file type
function validateFile(file, fileType) {
    const config = fileTypeConfigs[fileType];
    const fileName = file.name.toLowerCase();
    
    // Check if file extension is allowed
    const hasValidExtension = config.allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
        return {
            valid: false,
            message: `Invalid file type for ${fileType}. Allowed: ${config.allowedExtensions.join(', ')}`
        };
    }
    
    // Additional validation for specific file types
    if (fileType === 'zip') {
        // Check if ZIP file is not too large
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            return {
                valid: false,
                message: 'ZIP file too large (max 50MB)'
            };
        }
    }
    
    if (fileType === 'html' && !fileName.endsWith('.html') && !fileName.endsWith('.htm')) {
        return {
            valid: false,
            message: 'Only HTML files (.html or .htm) are allowed'
        };
    }
    
    return { valid: true, message: 'File is valid' };
}

// Event listener for file input
fileInput.addEventListener('change', function() {
    const fileType = fileTypeSelect.value;
    const config = fileTypeConfigs[fileType];
    
    // Get files from input
    const files = Array.from(this.files);
    
    // Reset selection
    selectedFiles = [];
    
    // Validate each file
    let hasInvalidFiles = false;
    
    if (files.length > 0) {
        // Check if multiple files are selected when not allowed
        if (!config.multiple && files.length > 1) {
            showResult(`Only one file allowed for ${fileType} type`, "error");
            addToConsole(`$ Error: Only one file allowed for ${fileType}`, "error");
            this.value = '';
            fileName.textContent = 'Choose a file';
            fileInputCustom.classList.remove('has-file');
            updateFileInfo();
            return;
        }
        
        // Validate each file
        for (const file of files) {
            const validation = validateFile(file, fileType);
            
            if (validation.valid) {
                selectedFiles.push(file);
            } else {
                addToConsole(`$ Invalid file: ${file.name} - ${validation.message}`, "error");
                hasInvalidFiles = true;
            }
        }
        
        if (selectedFiles.length > 0) {
            fileInputCustom.classList.add('has-file');
            
            if (config.multiple && selectedFiles.length > 0) {
                fileName.textContent = `${selectedFiles.length} files selected`;
            } else if (selectedFiles.length > 0) {
                fileName.textContent = selectedFiles[0].name;
            }
            
            addToConsole(`$ ${selectedFiles.length} valid file(s) selected`);
            selectedFiles.forEach(file => {
                addToConsole(`$   - ${file.name} (${formatFileSize(file.size)})`);
            });
            
            if (hasInvalidFiles) {
                showResult(`Some files were rejected. ${selectedFiles.length} valid file(s) selected.`, "error");
            }
        } else {
            // No valid files selected
            this.value = '';
            fileName.textContent = 'Choose a file';
            fileInputCustom.classList.remove('has-file');
            
            if (hasInvalidFiles) {
                showResult("No valid files selected. Please check file types.", "error");
            }
        }
    } else {
        fileName.textContent = 'Choose a file';
        fileInputCustom.classList.remove('has-file');
    }
    
    updateFileInfo();
});

// Handle drag and drop for file upload
fileInputCustom.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    this.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
});

fileInputCustom.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = selectedFiles.length > 0 ? 'rgba(100, 255, 100, 0.3)' : 'rgba(255, 255, 255, 0.2)';
    this.style.backgroundColor = selectedFiles.length > 0 ? 'rgba(20, 40, 20, 0.4)' : 'rgba(15, 15, 15, 0.6)';
});

fileInputCustom.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = selectedFiles.length > 0 ? 'rgba(100, 255, 100, 0.3)' : 'rgba(255, 255, 255, 0.2)';
    this.style.backgroundColor = selectedFiles.length > 0 ? 'rgba(20, 40, 20, 0.4)' : 'rgba(15, 15, 15, 0.6)';
    
    if (e.dataTransfer.files.length) {
        const fileType = fileTypeSelect.value;
        const config = fileTypeConfigs[fileType];
        const files = Array.from(e.dataTransfer.files);
        
        // Check if multiple files are dropped when not allowed
        if (!config.multiple && files.length > 1) {
            showResult(`Only one file allowed for ${fileType} type`, "error");
            addToConsole(`$ Error: Only one file allowed for ${fileType}`, "error");
            return;
        }
        
        // Create a new DataTransfer object to set files on input
        const dataTransfer = new DataTransfer();
        let validFilesCount = 0;
        
        // Validate and add files to DataTransfer
        for (const file of files) {
            const validation = validateFile(file, fileType);
            if (validation.valid) {
                dataTransfer.items.add(file);
                validFilesCount++;
            } else {
                addToConsole(`$ Invalid file dropped: ${file.name} - ${validation.message}`, "error");
            }
        }
        
        if (validFilesCount > 0) {
            // Set files on input
            fileInput.files = dataTransfer.files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        } else {
            showResult("No valid files dropped. Please check file types.", "error");
        }
    }
});

// Update file info display
function updateFileInfo() {
    if (selectedFiles.length > 1) {
        fileInfo.style.display = 'block';
        fileCount.textContent = selectedFiles.length;
        
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${index + 1}. ${file.name} (${formatFileSize(file.size)})</span>
            `;
            fileList.appendChild(fileItem);
        });
    } else {
        fileInfo.style.display = 'none';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add message to console
function addToConsole(message, type = 'normal') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Show result message
function showResult(message, type = 'normal') {
    resultPanel.className = 'result-panel';
    resultPanel.classList.remove('hidden');
    
    if (type === 'success') {
        resultPanel.classList.add('success');
    } else if (type === 'error') {
        resultPanel.classList.add('error');
    } else if (type === 'loading') {
        resultPanel.classList.add('loading');
    }
    
    resultMessage.innerHTML = message;
}

// Show info panel with website URL
function showInfoPanel(url) {
    infoPanel.classList.remove('hidden');
    websiteUrl.textContent = url;
    visitLink.href = url;
    
    // Update copy URL button
    copyUrlBtn.onclick = function() {
        navigator.clipboard.writeText(url).then(() => {
            const originalText = copyUrlBtn.innerHTML;
            copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyUrlBtn.innerHTML = originalText;
            }, 2000);
        });
    };
}

// Update stats display
function updateStatsDisplay() {
    totalDeployments.textContent = deploymentStats.total;
    successDeployments.textContent = deploymentStats.success;
    failedDeployments.textContent = deploymentStats.failed;
}

// Reset deploy button state
function resetDeployButton() {
    deployBtn.disabled = false;
    spinner.style.display = 'none';
    deployBtn.querySelector('span').textContent = 'Deploy Website';
}

// Form submission handler
deployForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const siteName = siteNameInput.value.trim();
    const fileType = fileTypeSelect.value;
    
    if (!siteName) {
        showResult("Please enter a website name", "error");
        addToConsole("$ Error: Website name is required", "error");
        return;
    }
    
    if (selectedFiles.length === 0) {
        showResult("Please upload at least one file", "error");
        addToConsole("$ Error: No files selected", "error");
        return;
    }

    // Show loading state
    deployBtn.disabled = true;
    spinner.style.display = 'block';
    deployBtn.querySelector('span').textContent = 'Deploying...';
    
    // Add to console
    addToConsole(`$ Starting deployment for: ${siteName}`);
    addToConsole(`$ File type: ${fileType.toUpperCase()}`);
    addToConsole(`$ Number of files: ${selectedFiles.length}`);
    
    // Show initial result message
    showResult("Creating a project in Vercel...", "loading");
    addToConsole('$ Creating project in Vercel...');
    
    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('siteName', siteName);
        formData.append('fileType', fileType);
        
        // Add all selected files
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        // Call backend API for deployment
        const response = await fetch('/api/deploy', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success && data.url) {
            const websiteUrl = data.url;
            const successMessage = `Website berhasil dibuat!<br><a href="${websiteUrl}" target="_blank" style="color: var(--success); text-decoration: none; font-weight: 600;">${websiteUrl}</a>`;
            
            showResult(successMessage, "success");
            addToConsole('$ Deployment successful!');
            addToConsole(`$ Website URL: ${websiteUrl}`);
            if (data.tokenIndex !== undefined) {
                addToConsole(`$ Used Token: ${data.tokenIndex + 1}`);
            }
            
            deploymentStats.success++;
            deploymentStats.total++;
            updateStatsDisplay();
            
            showInfoPanel(websiteUrl);
        } else {
            const errorMessage = `⚠️ Gagal: ${data.error || "Terjadi kesalahan"}`;
            showResult(errorMessage, "error");
            addToConsole(`$ Deployment failed: ${data.error || "Unknown error"}`, 'error');

            deploymentStats.failed++;
            deploymentStats.total++;
            updateStatsDisplay();
        }

    } catch (error) {
        showResult("Connection to server failed", "error");
        addToConsole('$ Connection failed to server', 'error');
        addToConsole(`$ Error: ${error.message}`, 'error');

        deploymentStats.failed++;
        deploymentStats.total++;
        updateStatsDisplay();
    }
    
    // Reset button state
    resetDeployButton();
});