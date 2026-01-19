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
        }
        h2 {
            color: var(--vscode-textLink-activeForeground);
            margin-bottom: 20px;
        }
        .card {
            background-color: var(--vscode-sideBar-background);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            max-width: 600px;
            margin-bottom: 20px;
        }
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        textarea {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px;
            border-radius: 4px;
            resize: vertical;
            min-height: 80px;
            font-family: monospace;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            align-self: flex-start;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Usage UI */
        .usage-section {
            display: none;
        }
        .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: bold;
        }
        .progress-container {
            background-color: var(--vscode-widget-border);
            border-radius: 10px;
            height: 20px;
            width: 100%;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .progress-bar {
            background: linear-gradient(90deg, var(--vscode-progressBar-background), #4caf50);
            height: 100%;
            width: 0%;
            transition: width 1s ease-in-out;
            border-radius: 10px;
        }
        .model-list {
            list-style: none;
            padding: 0;
        }
        .model-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .model-item:last-child {
            border-bottom: none;
        }
        .model-name {
            font-weight: 500;
        }
        .model-amount {
            font-family: monospace;
        }
        
        #raw-result {
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.7;
            display: none; /* Hidden by default */
        }
        .error {
            color: var(--vscode-errorForeground);
            border: 1px solid var(--vscode-errorForeground);
            padding: 10px;
            border-radius: 4px;
            display: none;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>Trae Usage</h2>
        
        <div class="input-group">
            <label for="cookie">Enter Cookie:</label>
            <textarea id="cookie" placeholder="Paste your cookie string here...">${initialCookie}</textarea>
            <button id="getTokenBtn">Get Usage Data</button>
        </div>

        <div id="loading" style="display:none;">Loading usage data...</div>
        <div id="error" class="error"></div>
    </div>

    <div id="usage-section" class="card usage-section">
        <h3>Total Usage</h3>
        <div class="progress-header">
            <span>Used: <span id="used-amount">0</span></span>
            <span>Limit: 600</span>
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
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const usageSection = document.getElementById('usage-section');
        const usedAmountSpan = document.getElementById('used-amount');
        const progressBar = document.getElementById('progress-bar');
        const modelList = document.getElementById('model-list');

        // Auto-fetch if cookie exists
        if (cookieInput.value.trim()) {
            fetchUsageData();
        }

        getTokenBtn.addEventListener('click', fetchUsageData);

        function fetchUsageData() {
            const cookie = cookieInput.value.trim();
            if (!cookie) {
                alert('Please enter a cookie');
                return;
            }
            
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            usageSection.style.display = 'none';
            
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
                    showError(message.error);
                    break;
            }
        });

        function showError(msg) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Error: ' + msg;
        }

        function renderUsage(data) {
            usageSection.style.display = 'block';
            
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
                progressBar.style.background = 'linear-gradient(90deg, var(--vscode-progressBar-background), #4caf50)';
            }

            // Update Breakdown UI
            modelList.innerHTML = '';
            Object.keys(summary).sort((a, b) => summary[b] - summary[a]).forEach(model => {
                const li = document.createElement('li');
                li.className = 'model-item';
                li.innerHTML = \`
                    <span class="model-name">\${model}</span>
                    <span class="model-amount">\${summary[model].toFixed(4)}</span>
                \`;
                modelList.appendChild(li);
            });
        }
    </script>
</body>
</html>`;
}
