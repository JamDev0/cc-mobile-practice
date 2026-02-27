# Examples: Route UI Data Playbook

## Example 1: Credentials Family

### Input

- `GET /credentials`
- `POST /credentials`
- `PATCH /credentials/{id}`
- `DELETE /credentials/{id}`

### Output pattern

```markdown
## Credentials routes

Routes:
- `GET /credentials`
- `POST /credentials`
- `PATCH /credentials/{id}`
- `DELETE /credentials/{id}`

### Swagger templates (fill with gathered UI data)

`POST /credentials`
```json
{
  "headers": { "teamid": "<TEAM_ID_UUID>" },
  "body": {
    "name": "<CREDENTIAL_NAME>",
    "type": "<CREDENTIAL_TYPE>",
    "nodesAccess": [{ "nodeType": "<NODE_TYPE_WITH_ACCESS>" }],
    "data": { "<FIELD_1>": "<VALUE_1>" }
  }
}
```

### Data to gather once
- Team ID -> replace `<TEAM_ID_UUID>`
- Credential name -> replace `<CREDENTIAL_NAME>`
- Credential type -> replace `<CREDENTIAL_TYPE>`
- Credential data fields -> replace `<FIELD_1>`, `<VALUE_1>`
- Credential id -> replace `<CREDENTIAL_ID_NUMERIC_STRING>`
```

## Example 2: Workflow + Run Family

### Input

- `GET /workflows`
- `POST /workflows`
- `PATCH /workflows/{id}`
- `POST /workflows/run`

### Output pattern

```markdown
## Workflows routes

### Swagger templates (fill with gathered UI data)

`POST /workflows/run`
```json
{
  "body": {
    "workflowData": {
      "id": "<WORKFLOW_ID_OPTIONAL>",
      "name": "<WORKFLOW_NAME>",
      "nodes": [{ "name": "<NODE_NAME>", "type": "<NODE_TYPE>", "semanticVersion": "<NODE_SEMVER>", "position": [250, 300], "parameters": {} }],
      "connections": {}
    },
    "runData": {},
    "startNodes": ["<START_NODE_NAME_OPTIONAL>"],
    "destinationNode": "<DESTINATION_NODE_OPTIONAL>"
  }
}
```

### Data to gather once
- Workflow id/name -> replace `<WORKFLOW_ID>`, `<WORKFLOW_NAME>`
- Node details -> replace `<NODE_NAME>`, `<NODE_TYPE>`, `<NODE_SEMVER>`
- Run scope -> replace `<START_NODE_NAME_OPTIONAL>`, `<DESTINATION_NODE_OPTIONAL>`
```

## Example 3: Quick mapping line style

Use one-line format:

- `POST /workflows/run` -> Execute workflow button (fill workflow placeholders and optional run controls)
