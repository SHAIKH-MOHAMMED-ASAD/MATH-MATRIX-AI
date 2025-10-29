// Solver JavaScript for solver.html
// Configuration - Moved inside solver.js to avoid loading issues
const CONFIG = {
    API_KEY: "AIzaSyDZFz4YxS-IvToBd0DNt9awT12p6BXU82Q",
    API_URL: "YOUR_API_KEY_HERE",
    PROMPT_TEMPLATE: `You are an expert mathematics tutor providing comprehensive, step-by-step solutions.

**Problem:** {PROBLEM}

Structure your response as follows:

**1. Problem Analysis**:
   - Identify the mathematical domain and problem type
   - Highlight key variables and constraints

**2. Key Concepts & Formulas**:
   - List relevant mathematical principles and formulas
   - Explain why each concept is applicable

**3. Step-by-Step Solution**:
   - Break down into logical, numbered steps
   - Explain reasoning behind each step
   - Show all intermediate calculations
   - Use proper mathematical notation

**4. Final Answer**:
   - Present solution clearly and prominently
   - Use \\boxed{answer} for important results
   - Include units where applicable

**5. Verification**:
   - Include verification using appropriate method
   - Explain the verification process

**6. Common Mistakes & Tips**:
   - Highlight common errors
   - Provide avoidance tips
   - Suggest related practice problems

Use clear, educational language with proper mathematical notation.`,
    
    SAFETY_SETTINGS: [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
    ],
    
    GENERATION_CONFIG: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        topP: 0.8,
        topK: 40,
    }
};

class MathSolver {
    constructor() {
        this.chatInput = document.getElementById('chat-input');
        this.chatWindow = document.getElementById('chat-window');
        this.keyboardToggleBtn = document.getElementById('keyboard-toggle-btn');
        this.mathKeyboard = document.getElementById('math-keyboard');
        this.functionsPanel = document.getElementById('functions-panel');
        this.livePreview = document.getElementById('live-preview-container');
        this.chatForm = document.getElementById('chat-form');
        this.sendBtn = document.getElementById('send-btn');
        this.clearBtn = document.getElementById('clear-btn');
        
        this.responseStartTime = null;
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        this.buildKeyboard();
        this.setupEventListeners();
        this.checkForExampleProblem();
        this.showWelcomeMessage();
        this.autoResizeInput();
    }
    
    buildKeyboard() {
        const keyboardLayout = {
            "Structures": {
                "Fractions": [ 
                    { display: '\\(\\frac{\\square}{\\square}\\)', value: '\\frac{}{}' }, 
                    { display: '\\(\\frac{dy}{dx}\\)', value: '\\frac{dy}{dx}' }, 
                    { display: '\\(\\frac{\\Delta y}{\\Delta x}\\)', value: '\\frac{\\Delta y}{\\Delta x}' } 
                ],
                "Radicals": [ 
                    { display: '\\(\\sqrt{\\square}\\)', value: '\\sqrt{}' }, 
                    { display: '\\(\\sqrt[\\square]{\\square}\\)', value: '\\sqrt[]{}' }, 
                    { display: '\\(\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\)', value: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' } 
                ],
                "Sub/Superscripts": [ 
                    { display: '\\(\\square_{\\square}\\)', value: '_{}' }, 
                    { display: '\\(\\square^{\\square}\\)', value: '^{}' }, 
                    { display: '\\(\\square_{\\square}^{\\square}\\)', value: '_{}^{}' } 
                ],
                "Summations & Integrals": [ 
                    { display: '\\(\\sum_{\\square}^{\\square}\\)', value: '\\sum_{}^{}' }, 
                    { display: '\\(\\int_{\\square}^{\\square}\\)', value: '\\int_{}^{}' }, 
                    { display: '\\(\\int\\)', value: '\\int' }, 
                    { display: '\\(\\oint\\)', value: '\\oint' } 
                ]
            },
            "Trigonometry": {
                "Functions": [ 
                    { display: 'sin', value: '\\sin()' }, 
                    { display: 'cos', value: '\\cos()' }, 
                    { display: 'tan', value: '\\tan()' } 
                ],
                "Inverse": [ 
                    { display: 'sin⁻¹', value: '\\sin^{-1}()' }, 
                    { display: 'cos⁻¹', value: '\\cos^{-1}()' }, 
                    { display: 'tan⁻¹', value: '\\tan^{-1}()' } 
                ],
                "Hyperbolic": [ 
                    { display: 'sinh', value: '\\sinh()' }, 
                    { display: 'cosh', value: '\\cosh()' }, 
                    { display: 'tanh', value: '\\tanh()' } 
                ]
            },
            "Linear Algebra": {
                "Matrix": [ 
                    { id: 'matrix-btn', display: 'Create Matrix', value: 'matrix' } 
                ]
            },
            "Symbols": {
                "Greek Letters": [ 
                    { display: '\\(\\alpha\\)', value: '\\alpha' }, 
                    { display: '\\(\\beta\\)', value: '\\beta' }, 
                    { display: '\\(\\theta\\)', value: '\\theta' }, 
                    { display: '\\(\\pi\\)', value: '\\pi' }, 
                    { display: '\\(\\lambda\\)', value: '\\lambda' }, 
                    { display: '\\(\\sigma\\)', value: '\\sigma' } 
                ],
                "Operators": [ 
                    { display: '\\(\\pm\\)', value: '\\pm' }, 
                    { display: '\\(\\times\\)', value: '\\times' }, 
                    { display: '\\(\\div\\)', value: '\\div' }, 
                    { display: '\\(\\neq\\)', value: '\\neq' }, 
                    { display: '\\(\\leq\\)', value: '\\leq' }, 
                    { display: '\\(\\approx\\)', value: '\\approx' } 
                ]
            }
        };

        const panelTabs = document.getElementById('panel-tabs');
        const panelContent = document.getElementById('panel-content');
        
        Object.keys(keyboardLayout).forEach((tabName, index) => {
            // Create tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = 'tab-btn';
            tabBtn.textContent = tabName;
            tabBtn.dataset.tab = tabName;
            if (index === 0) tabBtn.classList.add('active');
            panelTabs.appendChild(tabBtn);
            
            // Create tab pane
            const tabPane = document.createElement('div');
            tabPane.className = 'tab-pane';
            tabPane.id = `pane-${tabName}`;
            if (index === 0) tabPane.classList.add('active');
            
            // Add sections to tab pane
            const sections = keyboardLayout[tabName];
            Object.keys(sections).forEach(sectionName => {
                const sectionEl = document.createElement('div');
                sectionEl.className = 'pane-section';
                sectionEl.innerHTML = `<h4>${sectionName}</h4>`;
                
                const grid = document.createElement('div');
                grid.className = 'key-grid';
                
                sections[sectionName].forEach(key => {
                    const keyBtn = document.createElement('button');
                    keyBtn.className = 'keyboard-key';
                    keyBtn.innerHTML = key.display;
                    keyBtn.dataset.value = key.value;
                    if (key.id) keyBtn.id = key.id;
                    grid.appendChild(keyBtn);
                });
                
                sectionEl.appendChild(grid);
                tabPane.appendChild(sectionEl);
            });
            
            panelContent.appendChild(tabPane);
        });

        // Build main keyboard
        const mainKeyboard = document.getElementById('keyboard-main');
        mainKeyboard.innerHTML = `
            <button class="keyboard-key" data-value="1">1</button>
            <button class="keyboard-key" data-value="2">2</button>
            <button class="keyboard-key" data-value="3">3</button>
            <button class="keyboard-key" data-value="4">4</button>
            <button class="keyboard-key" data-value="5">5</button>
            <button class="keyboard-key" data-value="6">6</button>
            <button class="keyboard-key" data-value="7">7</button>
            <button class="keyboard-key" data-value="8">8</button>
            <button class="keyboard-key" data-value="9">9</button>
            <button class="keyboard-key" data-value="0">0</button>
            <button class="keyboard-key" data-value=".">.</button>
            <button class="keyboard-key" data-value=",">,</button>
            <button class="keyboard-key" data-value="!">!</button>
            <button class="keyboard-key" data-value="?">?</button>
            <button class="keyboard-key" data-value="\\space\\space ">Space</button>
            <button class="keyboard-key" data-value="(">(</button>
            <button class="keyboard-key" data-value=")">)</button>
            <button class="keyboard-key" data-value="+">+</button>
            <button class="keyboard-key" data-value="-">−</button>
            <button class="keyboard-key" data-value="=">=</button>
            <button class="keyboard-key" data-value="<">&lt;</button>
            <button class="keyboard-key" data-value=">">&gt;</button>
            <button class="keyboard-key" data-value="\\times">×</button>
            <button class="keyboard-key" data-value="\\div">÷</button>
            <button class="keyboard-key" data-value="\\sqrt{}">√</button>
            <button class="keyboard-key" data-value="^{2}">x²</button>
            <button class="keyboard-key" data-value="^{}">xⁿ</button>
            <button class="keyboard-key" data-value="\\pi">π</button>
            <button class="keyboard-key" data-value="\\leq">≤</button>
            <button class="keyboard-key" data-value="\\geq">≥</button>
            <button class="keyboard-key" data-value="|">|x|</button>
            <button class="keyboard-key action-key" id="functions-toggle">Math</button>
            <button class="keyboard-key action-key" type="submit" form="chat-form">→</button>
        `;
        
        if (window.MathJax) {
            MathJax.typesetPromise([panelContent]);
        }
    }
    
    setupEventListeners() {
        // Keyboard toggle
        this.keyboardToggleBtn.addEventListener('click', () => {
            const isHidden = this.mathKeyboard.style.display === 'none' || this.mathKeyboard.style.display === '';
            this.mathKeyboard.style.display = isHidden ? 'block' : 'none';
            if (!isHidden) this.functionsPanel.classList.remove('visible');
        });
        
        // Functions panel toggle
        this.mathKeyboard.addEventListener('click', e => {
            if (e.target.id === 'functions-toggle') {
                this.functionsPanel.classList.toggle('visible');
            }
        });
        
        // Tab switching
        document.getElementById('panel-tabs').addEventListener('click', e => {
            if (e.target.matches('.tab-btn')) {
                document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(`pane-${e.target.dataset.tab}`).classList.add('active');
            }
        });
        
        // Keyboard key insertion
        this.mathKeyboard.addEventListener('click', e => {
            const target = e.target.closest('.keyboard-key');
            if (target && target.dataset.value && target.id !== 'functions-toggle') {
                this.insertAtCursor(target.dataset.value);
                this.chatInput.focus();
            }
        });
        
        // Live preview
        this.chatInput.addEventListener('input', () => {
            this.autoResizeInput();
            this.updateLivePreview();
        });
        
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Clear chat
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.chatWindow.innerHTML = '';
                this.livePreview.style.display = 'none';
                this.chatInput.value = '';
                this.autoResizeInput();
                this.showWelcomeMessage();
            });
        }
        
        // Matrix modal setup
        this.setupMatrixModal();
    }

    autoResizeInput() {
        // Auto-resize textarea height within min/max bounds
        this.chatInput.style.height = 'auto';
        const maxHeight = 120; // keep in sync with CSS
        const newHeight = Math.min(this.chatInput.scrollHeight, maxHeight);
        this.chatInput.style.height = newHeight + 'px';
    }
    
    setupMatrixModal() {
        const matrixModal = document.getElementById('matrix-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const createGridBtn = document.getElementById('create-grid-btn');
        const insertMatrixBtn = document.getElementById('insert-matrix-btn');
        const gridContainer = document.getElementById('matrix-grid-container');
        const rowsInput = document.getElementById('matrix-rows');
        const colsInput = document.getElementById('matrix-cols');
        
        // Open matrix modal
        document.getElementById('panel-content').addEventListener('click', e => {
            if (e.target.id === 'matrix-btn') {
                matrixModal.classList.add('visible');
                createGridBtn.click();
            }
        });
        
        // Close modal
        closeModalBtn.addEventListener('click', () => matrixModal.classList.remove('visible'));
        matrixModal.addEventListener('click', e => {
            if (e.target === matrixModal) matrixModal.classList.remove('visible');
        });
        
        // Create matrix grid
        createGridBtn.addEventListener('click', () => {
            const rows = parseInt(rowsInput.value) || 1;
            const cols = parseInt(colsInput.value) || 1;
            gridContainer.innerHTML = '';
            gridContainer.style.gridTemplateColumns = `repeat(${cols}, auto)`;
            
            for (let i = 0; i < rows * cols; i++) {
                const cell = document.createElement('input');
                cell.type = 'text';
                cell.className = 'matrix-cell';
                cell.placeholder = '0';
                gridContainer.appendChild(cell);
            }
        });
        
        // Insert matrix
        insertMatrixBtn.addEventListener('click', () => {
            const rows = parseInt(rowsInput.value) || 1;
            const cols = parseInt(colsInput.value) || 1;
            const cells = gridContainer.querySelectorAll('.matrix-cell');
            let matrixString = '\\begin{bmatrix} ';
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const index = r * cols + c;
                    matrixString += cells[index].value || '0';
                    if (c < cols - 1) matrixString += ' & ';
                }
                if (r < rows - 1) matrixString += ' \\\\ ';
            }
            matrixString += ' \\end{bmatrix}';
            
            this.insertAtCursor(matrixString);
            matrixModal.classList.remove('visible');
        });
    }
    
    checkForExampleProblem() {
        const exampleProblem = localStorage.getItem('exampleProblem');
        if (exampleProblem) {
            this.chatInput.value = exampleProblem;
            this.updateLivePreview();
            this.autoResizeInput();
            localStorage.removeItem('exampleProblem');
        }
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            this.addMessage('Welcome to MathMatrix AI! Type your math problem or use the keyboard to get started.', 'bot');
        }, 500);
    }
    
    insertAtCursor(text) {
        const start = this.chatInput.selectionStart;
        this.chatInput.value = this.chatInput.value.slice(0, start) + text + this.chatInput.value.slice(start);
        this.chatInput.selectionStart = this.chatInput.selectionEnd = start + text.length;
        this.updateLivePreview();
    }
    
    updateLivePreview() {
        const text = this.chatInput.value.trim();
        if (text) {
            this.livePreview.style.display = 'block';
            
            // Check if the text contains LaTeX patterns
            const hasLatex = /[\\$]|\\\(|\\\[|\\begin\{|\\frac\{|\\sqrt\{|\\sum|\\int|\\alpha|\\beta|\\theta|\\pi/.test(text);
            
            if (hasLatex) {
                // For LaTeX content, use MathJax rendering
                this.livePreview.innerHTML = `\\[${text}\\]`;
                if (window.MathJax) {
                    MathJax.typesetPromise([this.livePreview]);
                }
            } else {
                // For plain text, preserve spaces and formatting
                const textWithSpaces = text.replace(/ /g, '&nbsp;').replace(/\n/g, '<br>');
                this.livePreview.innerHTML = `<div class="text-preview">${textWithSpaces}</div>`;
            }
        } else {
            this.livePreview.style.display = 'none';
        }
    }
    
    async handleSubmit() {
        if (this.isProcessing) return;
        
        const userMessage = this.chatInput.value.trim();
        if (!userMessage) return;
        
        this.addMessage(userMessage, 'user');
        this.chatInput.value = '';
        this.updateLivePreview();
        
        this.isProcessing = true;
        if (this.sendBtn) this.sendBtn.setAttribute('disabled', 'true');
        const loadingMessage = this.addMessage('Solving your problem...', 'bot');
        
        try {
            this.responseStartTime = Date.now();
            const response = await this.getAIResponse(userMessage);
            const responseTime = (Date.now() - this.responseStartTime) / 1000;
            
            loadingMessage.remove();
            
            const formattedResponse = this.formatResponse(response);
            this.addMessage(formattedResponse, 'bot');
            
            console.log(`Response time: ${responseTime.toFixed(2)}s`);
            
        } catch (error) {
            loadingMessage.remove();
            this.addMessage(`Error: ${error.message}`, 'bot');
        } finally {
            this.isProcessing = false;
            if (this.sendBtn) this.sendBtn.removeAttribute('disabled');
        }
    }
    
    async getAIResponse(userMessage) {
        if (!CONFIG.API_KEY || CONFIG.API_KEY === "YOUR_API_KEY_HERE") {
            throw new Error("API key not configured. Please set your API key in config.js");
        }
        
        const prompt = CONFIG.PROMPT_TEMPLATE.replace('{PROBLEM}', userMessage);
        
        try {
            const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: CONFIG.GENERATION_CONFIG,
                    safetySettings: CONFIG.SAFETY_SETTINGS
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                if (response.status === 400) {
                    throw new Error("Invalid request. Please check your input and try again.");
                } else if (response.status === 401) {
                    throw new Error("API key is invalid or expired. Please check your configuration.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. Please check your API permissions.");
                } else if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
                } else if (response.status >= 500) {
                    throw new Error("Server error. Please try again later.");
                } else {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            // Better error handling for API response
            if (!data.candidates || data.candidates.length === 0) {
                if (data.finishReason === 'SAFETY') {
                    throw new Error("Response blocked by safety filters. Please rephrase your question.");
                } else if (data.finishReason === 'RECITATION') {
                    throw new Error("Response blocked due to content policy. Please try a different approach.");
                } else {
                    throw new Error("No response generated. Please try rephrasing your question.");
                }
            }
            
            const candidate = data.candidates[0];
            
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error("Empty response from AI. Please try again.");
            }
            
            const text = candidate.content.parts[0].text;
            
            if (!text || text.trim().length === 0) {
                throw new Error("Empty response from AI. Please try rephrasing your question.");
            }
            
            return text;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error("Network error. Please check your internet connection and try again.");
            }
            throw error;
        }
    }
    
    formatResponse(response) {
        let formatted = response;
        
        // First, handle section headers before other processing
        const sectionMapping = {
            '1\\. Problem Analysis\\s*:': '1. Problem Analysis',
            '2\\. Key Concepts\\s*&?\\s*Formulas\\s*:': '2. Key Concepts & Formulas', 
            '3\\. Step-by-Step Solution\\s*:': '3. Step-by-Step Solution',
            '4\\. Final Answer\\s*:': '4. Final Answer',
            '5\\. Verification\\s*&?\\s*Quality Check\\s*:': '5. Verification & Quality Check',
            '6\\. Common Mistakes\\s*&?\\s*Tips\\s*:': '6. Common Mistakes & Tips'
        };
        
        for (const [pattern, replacement] of Object.entries(sectionMapping)) {
            formatted = formatted.replace(new RegExp(`^${pattern}`, 'gmi'), 
                `<div class="section-header">${replacement}</div>`);
        }
        
        // Handle boxed answers with better regex to capture complex content
        formatted = formatted.replace(/\\boxed\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gi, 
            '<div class="final-answer">\\[$1\\]</div>');
        
        // Handle aligned equations - convert to MathJax format
        formatted = formatted.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/gi, 
            (match, content) => {
                return `<div class="equation-align">\\[\\begin{aligned}${content}\\end{aligned}\\]</div>`;
            });
        
        // Handle eqnarray environments
        formatted = formatted.replace(/\\begin\{eqnarray\*?\}([\s\S]*?)\\end\{eqnarray\*?\}/gi, 
            (match, content) => {
                return `<div class="equation-align">\\[\\begin{aligned}${content}\\end{aligned}\\]</div>`;
            });
        
        // Convert double $$ to display math (handle this before single $)
        formatted = formatted.replace(/\$\$([^$]+)\$\$/g, 
            (match, math) => {
                return `\\[${math}\\]`;
            });
        
        // Convert single $ to inline math (be more careful with this)
        formatted = formatted.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, 
            (match, math) => {
                return `\\(${math}\\)`;
            });
        
        // Format step numbers with better regex
        formatted = formatted.replace(/^Step\s+(\d+):\s*([^\n<]+)/gm, 
            '<div class="step-number">$1</div><div class="step-content">$2</div>');
        
        formatted = formatted.replace(/^(\d+)\.\s*([^\n<]+)/gm, 
            '<div class="step-number">$1</div><div class="step-content">$2</div>');
        
        // Format bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle line breaks properly - preserve paragraph structure
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Wrap in paragraph tags if not already wrapped
        if (!formatted.includes('<div class="section-header">') && !formatted.includes('<div class="final-answer">')) {
            formatted = `<p>${formatted}</p>`;
        }
        
        // Clean up extra whitespace but preserve structure
        formatted = formatted.replace(/\s+/g, ' ');
        formatted = formatted.replace(/>\s+</g, '><');
        
        return formatted;
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'user') {
            // For user messages, preserve spaces and text formatting
            const textWithBreaks = text.replace(/\n/g, '<br>');
            contentDiv.innerHTML = `<div class="user-text">${textWithBreaks}</div>`;
        } else {
            contentDiv.innerHTML = text;
        }
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        this.chatWindow.appendChild(messageDiv);
        
        // Typeset MathJax for bot messages with better error handling
        if (sender === 'bot' && window.MathJax) {
            try {
                // Clear any previous MathJax processing
                MathJax.startup.document.state(0);
                
                // Process the content
                MathJax.typesetPromise([contentDiv]).then(() => {
                    this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
                }).catch(err => {
                    console.warn('MathJax rendering error:', err);
                    // Fallback: try to render without MathJax
                    this.fallbackMathRendering(contentDiv);
                    this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
                });
            } catch (error) {
                console.warn('MathJax initialization error:', error);
                this.fallbackMathRendering(contentDiv);
                this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
            }
        } else {
            this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
        }
        
        return messageDiv;
    }
    
    fallbackMathRendering(element) {
        // Simple fallback for when MathJax fails
        const content = element.innerHTML;
        
        // Convert basic LaTeX to readable text
        let fallbackContent = content
            .replace(/\\\[([^\]]+)\\\]/g, '<div class="math-fallback">[$1]</div>')
            .replace(/\\\(([^)]+)\\\)/g, '<span class="math-fallback-inline">($1)</span>')
            .replace(/\\boxed\{([^}]+)\}/g, '<div class="final-answer-fallback">Answer: $1</div>');
        
        element.innerHTML = fallbackContent;
    }
}

// Initialize the solver when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MathSolver();
});