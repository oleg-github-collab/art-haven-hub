package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/art-haven-hub/backend/internal/connector"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/ws"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
)

// WorkflowExecutor processes workflow executions from a Redis queue.
type WorkflowExecutor struct {
	db            *sqlx.DB
	rdb           *redis.Client
	connectorRepo *repository.ConnectorRepo
	socialRepo    *repository.SocialHubRepo
	registry      *connector.Registry
	hub           *ws.Hub
}

func NewWorkflowExecutor(
	db *sqlx.DB,
	rdb *redis.Client,
	connectorRepo *repository.ConnectorRepo,
	socialRepo *repository.SocialHubRepo,
	registry *connector.Registry,
	hub *ws.Hub,
) *WorkflowExecutor {
	return &WorkflowExecutor{
		db:            db,
		rdb:           rdb,
		connectorRepo: connectorRepo,
		socialRepo:    socialRepo,
		registry:      registry,
		hub:           hub,
	}
}

func (w *WorkflowExecutor) Start(ctx context.Context) {
	go w.processQueue(ctx)
	slog.Info("workflow executor worker started")
}

func (w *WorkflowExecutor) processQueue(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			slog.Info("workflow executor stopped")
			return
		default:
		}

		result, err := w.rdb.BLPop(ctx, 5*time.Second, "workflow:execute").Result()
		if err != nil {
			continue
		}
		if len(result) < 2 {
			continue
		}

		executionID := result[1]
		w.executeWorkflow(ctx, executionID)
	}
}

// WorkflowNode represents a node in the workflow graph.
type WorkflowNode struct {
	ID       string          `json:"id"`
	Type     string          `json:"type"`
	Label    string          `json:"label"`
	Config   json.RawMessage `json:"config"`
	Position struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
}

// WorkflowConnection represents a connection between nodes.
type WorkflowConnection struct {
	From string `json:"from"`
	To   string `json:"to"`
}

func (w *WorkflowExecutor) executeWorkflow(ctx context.Context, executionIDStr string) {
	execID, err := uuid.Parse(executionIDStr)
	if err != nil {
		slog.Error("invalid execution ID", "id", executionIDStr, "error", err)
		return
	}

	exec, err := w.connectorRepo.GetExecution(ctx, execID)
	if err != nil || exec == nil {
		slog.Error("execution not found", "id", executionIDStr, "error", err)
		return
	}

	// Mark as running
	w.connectorRepo.UpdateExecutionStatus(ctx, execID, "running", nil)
	w.sendProgress(exec.UserID, execID, "running", "", "")

	// Load workflow
	workflow, err := w.socialRepo.GetWorkflow(ctx, exec.WorkflowID)
	if err != nil || workflow == nil {
		errMsg := "workflow not found"
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "failed", &errMsg)
		w.sendProgress(exec.UserID, execID, "failed", "", errMsg)
		return
	}

	// Parse nodes and connections.
	// The frontend may store them as a JSON string (double-encoded),
	// so try direct unmarshal first, then unwrap the string.
	var nodes []WorkflowNode
	var connections []WorkflowConnection
	nodesRaw := workflow.Nodes
	if len(nodesRaw) > 0 && nodesRaw[0] == '"' {
		var s string
		json.Unmarshal(nodesRaw, &s)
		nodesRaw = json.RawMessage(s)
	}
	if err := json.Unmarshal(nodesRaw, &nodes); err != nil {
		errMsg := fmt.Sprintf("invalid workflow nodes: %v", err)
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "failed", &errMsg)
		return
	}
	connsRaw := workflow.Connections
	if len(connsRaw) > 0 && connsRaw[0] == '"' {
		var s string
		json.Unmarshal(connsRaw, &s)
		connsRaw = json.RawMessage(s)
	}
	if err := json.Unmarshal(connsRaw, &connections); err != nil {
		errMsg := fmt.Sprintf("invalid workflow connections: %v", err)
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "failed", &errMsg)
		return
	}

	// Load user connectors
	userConnectors, err := w.connectorRepo.List(ctx, exec.UserID)
	if err != nil {
		errMsg := fmt.Sprintf("failed to load connectors: %v", err)
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "failed", &errMsg)
		return
	}
	connectorMap := make(map[string]json.RawMessage)
	for _, c := range userConnectors {
		connectorMap[c.Platform] = c.Credentials
	}

	// Topological sort
	sorted := topologicalSort(nodes, connections)

	// Create node log entries
	nodeLogMap := make(map[string]uuid.UUID)
	for _, node := range sorted {
		logEntry := &model.ExecutionNodeLog{
			ExecutionID: execID,
			NodeID:      node.ID,
			NodeType:    node.Type,
			Status:      "pending",
		}
		if err := w.connectorRepo.CreateNodeLog(ctx, logEntry); err != nil {
			slog.Error("failed to create node log", "node", node.ID, "error", err)
			continue
		}
		nodeLogMap[node.ID] = logEntry.ID
	}

	// Execute nodes in topological order
	nodeOutputs := make(map[string]json.RawMessage)
	var execErr string

	for _, node := range sorted {
		logID, ok := nodeLogMap[node.ID]
		if !ok {
			continue
		}

		// Gather input from upstream nodes
		input := w.gatherInput(node.ID, connections, nodeOutputs)
		inputJSON, _ := json.Marshal(input)
		w.connectorRepo.StartNodeLog(ctx, logID, string(inputJSON))
		w.sendNodeProgress(exec.UserID, execID, node.ID, "running", nil)

		startTime := time.Now()

		// Determine which connector to use
		platform := w.resolvePlatform(node.Type)
		if platform == "" {
			// Source/action nodes pass through their config as output
			output := w.handleSourceNode(node)
			nodeOutputs[node.ID] = output
			durationMs := int(time.Since(startTime).Milliseconds())
			outputStr := string(output)
			w.connectorRepo.UpdateNodeLog(ctx, logID, "success", &outputStr, nil, durationMs)
			w.sendNodeProgress(exec.UserID, execID, node.ID, "success", output)
			continue
		}

		// Get connector credentials
		creds, hasCreds := connectorMap[platform]
		if !hasCreds {
			errMsg := fmt.Sprintf("connector '%s' not configured", platform)
			w.connectorRepo.UpdateNodeLog(ctx, logID, "failed", nil, &errMsg, 0)
			w.sendNodeProgress(exec.UserID, execID, node.ID, "failed", nil)
			execErr = errMsg
			break
		}

		// Create connector instance
		conn, err := w.registry.Create(platform, creds)
		if err != nil {
			errMsg := fmt.Sprintf("failed to create connector: %v", err)
			w.connectorRepo.UpdateNodeLog(ctx, logID, "failed", nil, &errMsg, 0)
			w.sendNodeProgress(exec.UserID, execID, node.ID, "failed", nil)
			execErr = errMsg
			break
		}

		// Execute the node
		output, err := conn.ExecuteNode(ctx, node.Type, node.Config, inputJSON)
		durationMs := int(time.Since(startTime).Milliseconds())

		if err != nil {
			errMsg := err.Error()
			w.connectorRepo.UpdateNodeLog(ctx, logID, "failed", nil, &errMsg, durationMs)
			w.sendNodeProgress(exec.UserID, execID, node.ID, "failed", nil)
			execErr = errMsg
			break
		}

		nodeOutputs[node.ID] = output
		outputStr := string(output)
		w.connectorRepo.UpdateNodeLog(ctx, logID, "success", &outputStr, nil, durationMs)
		w.sendNodeProgress(exec.UserID, execID, node.ID, "success", output)
	}

	// Finalize execution
	if execErr != "" {
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "failed", &execErr)
		w.sendProgress(exec.UserID, execID, "failed", "", execErr)
	} else {
		w.connectorRepo.UpdateExecutionStatus(ctx, execID, "completed", nil)
		w.sendProgress(exec.UserID, execID, "completed", "", "")
	}

	// Update workflow stats
	w.socialRepo.UpdateWorkflowRunStats(ctx, exec.WorkflowID)
}

func (w *WorkflowExecutor) gatherInput(nodeID string, connections []WorkflowConnection, outputs map[string]json.RawMessage) map[string]interface{} {
	merged := make(map[string]interface{})
	for _, conn := range connections {
		if conn.To == nodeID {
			if output, ok := outputs[conn.From]; ok {
				var data map[string]interface{}
				json.Unmarshal(output, &data)
				for k, v := range data {
					merged[k] = v
				}
			}
		}
	}
	return merged
}

func (w *WorkflowExecutor) resolvePlatform(nodeType string) string {
	platformMap := map[string]string{
		"ai_adapt": "openai", "ai_caption": "openai", "ai_hashtags": "openai",
		"ai_translate": "openai", "ai_image_edit": "openai", "ai_describe": "openai",
		"pinterest": "pinterest", "pinterest_pin": "pinterest", "pinterest_boards": "pinterest",
		"etsy": "etsy", "etsy_listing": "etsy", "etsy_shops": "etsy",
		"shopify": "shopify", "shopify_product": "shopify", "shopify_collections": "shopify",
		"printful_sync": "printful", "printful_mockup": "printful", "printful_products": "printful",
		"cloudinary_upload": "cloudinary", "cloudinary_transform": "cloudinary", "cloudinary_optimize": "cloudinary",
	}
	return platformMap[nodeType]
}

func (w *WorkflowExecutor) handleSourceNode(node WorkflowNode) json.RawMessage {
	if len(node.Config) > 0 && string(node.Config) != "{}" && string(node.Config) != "null" {
		return node.Config
	}
	out, _ := json.Marshal(map[string]interface{}{
		"node_id": node.ID, "node_type": node.Type, "label": node.Label,
	})
	return out
}

func (w *WorkflowExecutor) sendProgress(userID, execID uuid.UUID, status, nodeID, errMsg string) {
	if w.hub == nil {
		return
	}
	payload := map[string]interface{}{
		"execution_id": execID.String(), "status": status,
	}
	if nodeID != "" {
		payload["node_id"] = nodeID
	}
	if errMsg != "" {
		payload["error"] = errMsg
	}
	data, _ := json.Marshal(payload)
	w.hub.SendToUser(userID, ws.WSMessage{Type: "execution_progress", Payload: data})
}

func (w *WorkflowExecutor) sendNodeProgress(userID, execID uuid.UUID, nodeID, status string, output json.RawMessage) {
	if w.hub == nil {
		return
	}
	payload := map[string]interface{}{
		"execution_id": execID.String(), "node_id": nodeID, "status": status,
	}
	if output != nil {
		payload["output"] = json.RawMessage(output)
	}
	data, _ := json.Marshal(payload)
	w.hub.SendToUser(userID, ws.WSMessage{Type: "node_progress", Payload: data})
}

// EnqueueWorkflowExecution adds a workflow execution to the Redis queue.
func EnqueueWorkflowExecution(ctx context.Context, rdb *redis.Client, executionID uuid.UUID) error {
	return rdb.RPush(ctx, "workflow:execute", executionID.String()).Err()
}

// topologicalSort orders nodes by dependency (Kahn's algorithm).
func topologicalSort(nodes []WorkflowNode, connections []WorkflowConnection) []WorkflowNode {
	nodeMap := make(map[string]WorkflowNode)
	inDegree := make(map[string]int)
	children := make(map[string][]string)

	for _, n := range nodes {
		nodeMap[n.ID] = n
		inDegree[n.ID] = 0
	}
	for _, c := range connections {
		children[c.From] = append(children[c.From], c.To)
		inDegree[c.To]++
	}

	var queue []string
	for id, deg := range inDegree {
		if deg == 0 {
			queue = append(queue, id)
		}
	}

	var sorted []WorkflowNode
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if node, ok := nodeMap[id]; ok {
			sorted = append(sorted, node)
		}
		for _, child := range children[id] {
			inDegree[child]--
			if inDegree[child] == 0 {
				queue = append(queue, child)
			}
		}
	}

	// Append unreachable nodes (cycles)
	if len(sorted) < len(nodes) {
		visited := make(map[string]bool)
		for _, n := range sorted {
			visited[n.ID] = true
		}
		for _, n := range nodes {
			if !visited[n.ID] {
				sorted = append(sorted, n)
			}
		}
	}

	return sorted
}
