import * as vscode from "vscode";
import { output } from "./logging";
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
    output.appendLine("Formatting document with Rzk language server.");
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
    output.appendLine(
      `Formatting complete. Applying ${lspResults?.length} edits.`
    );

    // Temporary hack to run Prettier on Literate Rzk files after our formatter
    const isPrettierEnabled = vscode.workspace
      .getConfiguration("prettier")
      .get<boolean>("enable");
    if (isPrettierEnabled && document.languageId === "literate rzk markdown") {
      // The command is ran after a timeout to allow the text edits from LSP to
      // be applied first, since otherwise the document would be modified first
      // and the request will be cancelled.
      setTimeout(() => {
        output.appendLine("Formatting document with Prettier");
        vscode.commands.executeCommand("prettier.forceFormatDocument").then(
          () => {
            output.appendLine("Applied Prettier formatting");
          },
          (err) => {
            output.appendLine("Prettier formatting failed: " + err);
          }
        );
      }, 100);
    }

    return lspResults;
  }
}
