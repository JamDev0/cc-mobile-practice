# Reference: Route UI Data Playbook

## Section Skeleton

Use this order in generated guides:

1. Global placeholder reference
2. Auth/session assumptions
3. Grouped section A
4. Grouped section B
5. Grouped section C
6. Quick mapping

## Group Section Skeleton

```markdown
## <N>) <Group name>

Routes:
- `<METHOD /path>`
- `<METHOD /path>`

### Swagger templates (fill with gathered UI data)

`<METHOD /path>`
```json
{
  "path": {},
  "headers": {},
  "query": {},
  "body": {}
}
```

### Data to gather once
- <human concept> -> replace `<PLACEHOLDER>`

### UI steps
1. ...
2. ...
```

## Placeholder Conventions

- Format: `<UPPER_SNAKE_CASE>`
- Optional: `<FIELD_OPTIONAL>`
- IDs: `<ENTITY_ID>` or route-specific `<CREDENTIAL_ID_NUMERIC_STRING>`
- Team header: `<TEAM_ID_UUID>`

## Grouping Heuristics

Group routes together when they share:

- same entity (`credentials`, `workflows`, `tags`)
- same base payload model
- same IDs and lifecycle (list/create/update/delete)

Do not split a family unless auth mode or payload shape differs significantly.

## Auth Mode Notes

Always state one of:

- standalone: user may need explicit auth context
- auth layer: UI injects session/team headers

If unknown, ask user before final assumptions.
