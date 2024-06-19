import * as vscode from "vscode";
import {
  Middleware,
  ProvideDocumentFormattingEditsSignature,
} from "vscode-languageclient";

export default class Middlewares implements Middleware {
  constructor(private context: vscode.ExtensionContext) {}

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken,
    next: ProvideDocumentFormattingEditsSignature
  ) {
    const lspResults = await next(document, options, token);
    const previouslyPrompted = this.context.globalState.get<boolean>(
      "formattingPromptDisplayed",
      false
    );
    if (lspResults?.length && !previouslyPrompted) {
      vscode.window
        .showInformationMessage(
          "Your document has just been formatted by Rzk! You can disable this in the extension settings.",
          "Keep it enabled",
          "Disable autoformatting"
        )
        .then((choice) => {
          if (choice === "Disable autoformatting") {
            vscode.workspace
              .getConfiguration("rzk")
              .update("format.enable", false);
          }
          if (choice) {
            this.context.globalState.update("formattingPromptDisplayed", true);
          }
        });
    }
    return lspResults;
  }
}
