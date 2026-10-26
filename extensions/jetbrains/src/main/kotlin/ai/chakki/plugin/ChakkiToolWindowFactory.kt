package ai.chakki.plugin

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import javax.swing.*
import java.awt.BorderLayout

class ChakkiToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = JPanel(BorderLayout())
        
        val header = JLabel("Chakki Studio - Autonomous Engine Client")
        header.border = BorderFactory.createEmptyBorder(8, 8, 8, 8)
        panel.add(header, BorderLayout.NORTH)

        val logArea = JTextArea("Engine connection: Ready\nConnected to Canonical Engine v2.0\n")
        logArea.isEditable = false
        val scrollPane = JScrollPane(logArea)
        panel.add(scrollPane, BorderLayout.CENTER)

        val bottomPanel = JPanel(BorderLayout())
        val inputField = JTextField()
        val submitBtn = JButton("Execute Task")

        val client = ChakkiRpcClient()

        submitBtn.addActionListener {
            val prompt = inputField.text.trim()
            if (prompt.isNotEmpty()) {
                logArea.append("\n[TASK] $prompt\n")
                val response = client.sendRequest("task.start", """{"prompt": "$prompt"}""")
                logArea.append("[RESPONSE] $response\n")
                inputField.text = ""
            }
        }

        bottomPanel.add(inputField, BorderLayout.CENTER)
        bottomPanel.add(submitBtn, BorderLayout.EAST)
        panel.add(bottomPanel, BorderLayout.SOUTH)

        val content = ContentFactory.getInstance().createContent(panel, "", false)
        toolWindow.contentManager.addContent(content)
    }
}
