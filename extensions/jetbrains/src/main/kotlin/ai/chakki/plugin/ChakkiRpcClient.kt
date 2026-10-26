package ai.chakki.plugin

import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URI
import java.util.UUID

/**
 * Chakki Canonical Engine JSON-RPC 2.0 Client for JetBrains IntelliJ Platform.
 * Connects to the local canonical engine daemon, sends framed JSON-RPC 2.0 requests,
 * and handles structured responses with zero simulated mock fallbacks.
 */
class ChakkiRpcClient(
    val engineUrl: String = "http://127.0.0.1:8765/rpc",
    val connectTimeoutMs: Int = 3000,
    val readTimeoutMs: Int = 10000
) {
    /**
     * Send raw JSON-RPC 2.0 request with serialized JSON params
     */
    fun sendRequest(method: String, paramsJson: String): String {
        val requestId = UUID.randomUUID().toString()
        val envelope = """
            {
              "jsonrpc": "2.0",
              "id": "$requestId",
              "method": "$method",
              "params": $paramsJson
            }
        """.trimIndent()

        return executeHttpPost(envelope)
    }

    /**
     * Overloaded sendRequest accepting key-value map params
     */
    fun sendRequest(method: String, params: Map<String, Any?>): String {
        val paramsJson = buildJsonString(params)
        return sendRequest(method, paramsJson)
    }

    /**
     * Doctor diagnostics check against Canonical Engine
     */
    fun doctor(): String {
        return sendRequest("engine.doctor", "{}")
    }

    /**
     * Query live model catalogue from Engine
     */
    fun getModels(): String {
        return sendRequest("engine.models", "{}")
    }

    /**
     * Cancel an active task in Canonical Engine
     */
    fun cancelTask(taskId: String): String {
        return sendRequest("task.cancel", """{"taskId": "$taskId"}""")
    }

    /**
     * Approve or reject a pending tool execution (file patch, bash command, etc.)
     */
    fun approveTool(taskId: String, toolCallId: String, approved: Boolean): String {
        return sendRequest(
            "engine.approve_tool",
            """{"taskId": "$taskId", "toolCallId": "$toolCallId", "approved": $approved}"""
        )
    }

    private fun executeHttpPost(payload: String): String {
        return try {
            val url = URI.create(engineUrl).toURL()
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                doOutput = true
                connectTimeout = connectTimeoutMs
                readTimeout = readTimeoutMs
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "Chakki-JetBrains-Plugin/2.0.0")
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload)
                writer.flush()
            }

            val statusCode = connection.responseCode
            val inputStream = if (statusCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream ?: connection.inputStream
            }

            val responseBody = BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).use { reader ->
                reader.readText()
            }

            if (statusCode !in 200..299) {
                """{"jsonrpc":"2.0","error":{"code":$statusCode,"message":"HTTP error: $responseBody"}}"""
            } else {
                responseBody
            }
        } catch (e: Exception) {
            // Truthful connection failure report (Never fabricate mock answers)
            """{"jsonrpc":"2.0","error":{"code":-32000,"message":"Engine connection failed at $engineUrl: ${e.message ?: "Connection refused"}"}}"""
        }
    }

    private fun buildJsonString(map: Map<String, Any?>): String {
        val pairs = map.entries.joinToString(",") { (key, value) ->
            val serializedVal = when (value) {
                null -> "null"
                is Number, is Boolean -> value.toString()
                else -> "\"${value.toString().replace("\"", "\\\"").replace("\n", "\\n")}\""
            }
            "\"$key\":$serializedVal"
        }
        return "{$pairs}"
    }
}
