import * as vscode from 'vscode';

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

		panel.webview.html = getWebviewContent();
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

function getWebviewContent() {
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
        }
        .card {
            background-color: var(--vscode-sideBar-background);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            max-width: 400px;
        }
        .progress-container {
            margin-top: 15px;
            background-color: var(--vscode-widget-border);
            border-radius: 10px;
            height: 20px;
            width: 100%;
            overflow: hidden;
        }
        .progress-bar {
            background: linear-gradient(90deg, var(--vscode-progressBar-background), #4caf50);
            height: 100%;
            width: 0%; /* Start at 0 for animation */
            transition: width 1s ease-in-out;
            border-radius: 10px;
        }
        .usage-text {
            margin-top: 10px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>Trae Usage</h2>
        <p>Current session usage statistics.</p>
        
        <div class="usage-text">
            <span>Used</span>
            <span id="percentage">0%</span>
        </div>
        
        <div class="progress-container">
            <div class="progress-bar" id="bar"></div>
        </div>
    </div>

    <script>
        // Simulate loading animation
        setTimeout(() => {
            const bar = document.getElementById('bar');
            const text = document.getElementById('percentage');
            const target = 65;
            bar.style.width = target + '%';
            text.innerText = target + '%';
        }, 100);
    </script>
</body>
</html>`;
}

export function deactivate() {}
