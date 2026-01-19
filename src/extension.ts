import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "trae-usage-plugin" is now active!');

	// Register the Hello World command
	let helloWorldDisposable = vscode.commands.registerCommand('trae-usage-plugin.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Trae Usage Plugin!');
	});
	context.subscriptions.push(helloWorldDisposable);

	// Register the Show Usage command (Opens Webview)
	let showUsageDisposable = vscode.commands.registerCommand('trae-usage-plugin.showUsage', () => {
		const panel = vscode.window.createWebviewPanel(
			'traeUsage',
			'Trae Usage',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		const savedCookie = context.globalState.get<string>('traeUserCookie') || '';
		panel.webview.html = getWebviewContent(savedCookie);

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'getToken':
						try {
							// Save cookie for future use
							await context.globalState.update('traeUserCookie', message.cookie);

							// Step 1: Get Token
							const tokenResponse = await axios.post(
								'https://api-us-east.trae.ai/cloudide/api/v3/common/GetUserToken',
								{}, 
								{
									headers: {
										'accept': 'application/json, text/plain, */*',
										'accept-language': 'en,zh;q=0.9,zh-CN;q=0.8',
										'cache-control': 'no-cache',
										'origin': 'https://www.trae.ai',
										'referer': 'https://www.trae.ai/',
										'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
										'cookie': message.cookie
									}
								}
							);

							// Extract token from response.data.Result.Token
							const tokenData = tokenResponse.data;
							const token = tokenData.Result?.Token;

							if (!token) {
								throw new Error('Token not found in response: ' + JSON.stringify(tokenData));
							}

							// Step 2: Get Usage (Last 7 days)
							const now = Math.floor(Date.now() / 1000);
							const sevenDaysAgo = now - 7 * 24 * 60 * 60;
							
							const usageResponse = await axios.post(
								'https://api-us-east.trae.ai/trae/api/v1/pay/query_user_usage_group_by_session',
								{ 
									start_time: sevenDaysAgo,
									end_time: now,
									page_size: 20,
									page_num: 1
								},
								{
									headers: {
										'accept': 'application/json, text/plain, */*',
										'accept-language': 'en,zh;q=0.9,zh-CN;q=0.8',
										'authorization': `Cloud-IDE-JWT ${token}`,
										'cache-control': 'no-cache',
										'content-type': 'application/json',
										'origin': 'https://www.trae.ai',
										'referer': 'https://www.trae.ai/',
										'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
										'cookie': message.cookie
									}
								}
							);
							
							// Send final result back to webview
							panel.webview.postMessage({ command: 'showToken', token: JSON.stringify(usageResponse.data, null, 2) });
						} catch (error: any) {
							const errorMessage = error.response 
								? `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`
								: error.message;
							panel.webview.postMessage({ command: 'showError', error: errorMessage });
						}
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});
	context.subscriptions.push(showUsageDisposable);

	// Create Status Bar Item
	let myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'trae-usage-plugin.showUsage';
	myStatusBarItem.text = 'trae usage';
	myStatusBarItem.tooltip = 'Click to show detailed usage';
	myStatusBarItem.show();
	context.subscriptions.push(myStatusBarItem);
}

function getWebviewContent(initialCookie: string = '') {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trae Usage</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            max-width: 800px;
            margin: 0 auto;
        }
        h2 {
            color: var(--vscode-editor-foreground);
            margin-bottom: 24px;
            font-weight: 600;
            font-size: 1.5em;
        }
        .card {
            background-color: var(--vscode-editor-background);
            padding: 0;
            border-radius: 0;
            box-shadow: none;
            margin-bottom: 24px;
        }
        
        /* Collapsible Cookie Section */
        details {
            background-color: var(--vscode-sideBar-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-widget-border);
            margin-bottom: 24px;
            overflow: hidden;
            transition: all 0.2s ease;
        }
        
        summary {
            padding: 12px 16px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9em;
            background-color: rgba(255, 255, 255, 0.05);
            color: var(--vscode-foreground);
            list-style: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
        }
        
        summary:hover {
            background-color: rgba(255, 255, 255, 0.08);
        }
        
        summary::-webkit-details-marker {
            display: none;
        }
        
        summary::after {
            content: '';
            width: 16px;
            height: 16px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="%23cccccc"><path d="M4.5 6l3.5 4 3.5-4z"/></svg>');
            background-repeat: no-repeat;
            background-position: center;
            transition: transform 0.2s;
            opacity: 0.7;
        }
        
        /* Adjust SVG color for light theme if needed, but hex #cccccc is neutral enough. 
           Using currentcolor is better but needs encoded SVG. */
           
        details[open] summary::after {
            transform: rotate(180deg);
        }

        .cookie-content {
            padding: 20px;
            border-top: 1px solid var(--vscode-widget-border);
            animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        label {
            font-weight: 600;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        textarea {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 12px;
            border-radius: 6px;
            resize: vertical;
            min-height: 100px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            transition: border-color 0.2s;
        }
        
        textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            align-self: flex-start;
            font-weight: 600;
            font-size: 0.9em;
            transition: background-color 0.2s;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Usage UI */
        .usage-section {
            display: none;
            background-color: var(--vscode-sideBar-background);
            padding: 24px;
            border-radius: 12px;
            border: 1px solid var(--vscode-widget-border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        h3 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 1.1em;
            color: var(--vscode-editor-foreground);
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        
        .usage-value {
            font-weight: bold;
            color: var(--vscode-editor-foreground);
            font-size: 1.1em;
        }

        .progress-container {
            background-color: var(--vscode-scrollbarSlider-background);
            border-radius: 10px;
            height: 12px;
            width: 100%;
            overflow: hidden;
            margin-bottom: 32px;
        }
        
        .progress-bar {
            background: var(--vscode-progressBar-background);
            height: 100%;
            width: 0%;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
        }
        
        .model-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .model-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        
        .model-item:last-child {
            border-bottom: none;
        }
        
        .model-name {
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .model-amount {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-weight: 600;
        }
        
        .loading-container {
            display: none;
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .spinner {
            border: 3px solid var(--vscode-scrollbarSlider-background);
            border-top: 3px solid var(--vscode-progressBar-background);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            color: var(--vscode-errorForeground);
            background-color: rgba(255, 0, 0, 0.1);
            border: 1px solid var(--vscode-errorForeground);
            padding: 16px;
            border-radius: 8px;
            display: none;
            margin-top: 24px;
            font-size: 0.9em;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>Trae Usage Dashboard</h2>
        
        <details id="cookie-details">
            <summary>Configuration</summary>
            <div class="cookie-content">
                <div class="input-group">
                    <label for="cookie">Trae Cookie</label>
                    <textarea id="cookie" placeholder="Paste your cookie string here to authenticate...">${initialCookie}</textarea>
                    <button id="getTokenBtn">Get Usage Data</button>
                </div>
            </div>
        </details>

        <div id="loading" class="loading-container">
            <div class="spinner"></div>
            <div>Fetching usage data...</div>
        </div>
        
        <div id="error" class="error"></div>
    </div>

    <div id="usage-section" class="usage-section">
        <h3>Total Usage (Last 7 Days)</h3>
        <div class="progress-header">
            <span>Used: <span id="used-amount" class="usage-value">0</span></span>
            <span>Limit: <span class="usage-value">600</span></span>
        </div>
        <div class="progress-container">
            <div class="progress-bar" id="progress-bar"></div>
        </div>
        
        <h3>Breakdown by Model</h3>
        <ul id="model-list" class="model-list">
            <!-- Items will be injected here -->
        </ul>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const getTokenBtn = document.getElementById('getTokenBtn');
        const cookieInput = document.getElementById('cookie');
        const cookieDetails = document.getElementById('cookie-details');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const usageSection = document.getElementById('usage-section');
        const usedAmountSpan = document.getElementById('used-amount');
        const progressBar = document.getElementById('progress-bar');
        const modelList = document.getElementById('model-list');

        // Initial check: if cookie exists, auto-fetch.
        // If cookie is empty, ensure details is open.
        if (cookieInput.value.trim()) {
            cookieDetails.open = false; // Collapse if we have a cookie
            fetchUsageData();
        } else {
            cookieDetails.open = true; // Open if no cookie
        }

        getTokenBtn.addEventListener('click', fetchUsageData);

        function fetchUsageData() {
            const cookie = cookieInput.value.trim();
            if (!cookie) {
                showError('Please enter a cookie');
                cookieDetails.open = true;
                return;
            }
            
            // UI State: Loading
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            usageSection.style.display = 'none';
            // Collapse while loading to clean up UI
            cookieDetails.open = false;
            
            vscode.postMessage({
                command: 'getToken',
                cookie: cookie
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            loadingDiv.style.display = 'none';

            switch (message.command) {
                case 'showToken':
                    try {
                        const data = JSON.parse(message.token);
                        renderUsage(data);
                    } catch (e) {
                        showError('Failed to parse response data: ' + e.message);
                    }
                    break;
                case 'showError':
                    // On error, expand to show input
                    cookieDetails.open = true;
                    showError(message.error);
                    break;
            }
        });

        function showError(msg) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = msg;
        }

        function renderUsage(data) {
            usageSection.style.display = 'block';
            // Ensure collapsed on success
            cookieDetails.open = false;
            
            const sessions = data.user_usage_group_by_sessions || [];
            const summary = {};
            let totalUsage = 0;
            const LIMIT = 600;

            // Calculate totals
            sessions.forEach(session => {
                const model = session.model_name || 'Unknown';
                const amount = session.amount_float || 0;
                
                if (!summary[model]) summary[model] = 0;
                summary[model] += amount;
                totalUsage += amount;
            });

            // Update Total UI
            usedAmountSpan.textContent = totalUsage.toFixed(2);
            const percentage = Math.min((totalUsage / LIMIT) * 100, 100);
            progressBar.style.width = percentage + '%';
            
            // Set color based on usage
            if (percentage > 90) {
                progressBar.style.background = 'var(--vscode-errorForeground)';
            } else if (percentage > 70) {
                progressBar.style.background = '#ff9800'; // Orange
            } else {
                progressBar.style.background = 'var(--vscode-progressBar-background)';
            }

            // Update Breakdown UI
            modelList.innerHTML = '';
            const sortedModels = Object.keys(summary).sort((a, b) => summary[b] - summary[a]);
            
            if (sortedModels.length === 0) {
                modelList.innerHTML = '<li class="model-item" style="justify-content:center; opacity:0.7;">No usage data found for this period.</li>';
            } else {
                sortedModels.forEach(model => {
                    const li = document.createElement('li');
                    li.className = 'model-item';
                    li.innerHTML = \`
                        <span class="model-name">\${model}</span>
                        <span class="model-amount">\${summary[model].toFixed(4)}</span>
                    \`;
                    modelList.appendChild(li);
                });
            }
        }
    </script>
</body>
</html>`;
}
