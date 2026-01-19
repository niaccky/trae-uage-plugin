import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "trae-usage-plugin" is now active!');

	let disposable = vscode.commands.registerCommand('trae-usage-plugin.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Trae Usage Plugin!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
