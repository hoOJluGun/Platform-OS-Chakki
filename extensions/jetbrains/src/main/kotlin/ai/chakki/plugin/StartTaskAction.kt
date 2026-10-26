package ai.chakki.plugin

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.wm.ToolWindowManager

/**
 * Action allowing users to trigger a Chakki autonomous task directly from the Tools menu
 * or via keyboard shortcut (Ctrl+Alt+C / Cmd+Alt+C).
 */
class StartTaskAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return

        // Focus or activate the Chakki Tool Window
        val toolWindowManager = ToolWindowManager.getInstance(project)
        val toolWindow = toolWindowManager.getToolWindow("Chakki Agent")
        toolWindow?.show()

        val prompt = Messages.showInputDialog(
            project,
            "Enter directive or engineering task for Chakki Canonical Engine:",
            "Chakki Autonomous Task",
            Messages.getQuestionIcon()
        )

        if (!prompt.isNullOrBlank()) {
            val client = ChakkiRpcClient()
            val response = client.sendRequest(
                "task.start",
                mapOf(
                    "prompt" to prompt,
                    "workspacePath" to (project.basePath ?: ".")
                )
            )

            Messages.showInfoMessage(
                project,
                "Task initiated successfully with Chakki Canonical Engine:\n$response",
                "Chakki Task Status"
            )
        }
    }
}
