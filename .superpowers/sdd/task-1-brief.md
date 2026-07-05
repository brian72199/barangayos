### Task 1: PocketBase Migration JSON

**Files:**
- Create: `pocketbase/migrations/001_residents_households.json`

**Interfaces:**
- Produces: Collection definitions that the API layer (Task 2) depends on for `residents` and `households` collection names and field names.

- [ ] **Step 1: Create migration JSON**

```json
[
  {
    "name": "residents",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "first_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "last_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "middle_name", "type": "text", "options": { "max": 255 } },
      { "name": "suffix", "type": "select", "options": { "values": ["\u2014", "Jr.", "Sr.", "II", "III", "IV"] } },
      { "name": "birth_date", "type": "date" },
      { "name": "age", "type": "number" },
      { "name": "gender", "type": "select", "options": { "values": ["male", "female"] } },
      { "name": "contact_number", "type": "text", "options": { "max": 20 } },
      { "name": "household_id", "type": "relation", "options": { "collectionId": "households", "maxSelect": 1 } },
      { "name": "purok", "type": "text", "options": { "max": 100 } },
      { "name": "civil_status", "type": "select", "options": { "values": ["single", "married", "widowed", "separated"] } },
      { "name": "occupation", "type": "text", "options": { "max": 255 } },
      { "name": "nationality", "type": "text", "options": { "max": 100 } },
      { "name": "is_voter", "type": "bool" },
      { "name": "is_4ps", "type": "bool" },
      { "name": "is_senior", "type": "bool" },
      { "name": "is_pwd", "type": "bool" },
      { "name": "blood_type", "type": "select", "options": { "values": ["\u2014", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] } },
      { "name": "notes", "type": "text", "options": { "max": 2000 } }
    ],
    "indexes": [
      "CREATE INDEX idx_residents_name ON residents (last_name, first_name)",
      "CREATE INDEX idx_residents_purok ON residents (purok)",
      "CREATE INDEX idx_residents_household ON residents (household_id)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  },
  {
    "name": "households",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "household_number", "type": "text", "required": true, "options": { "max": 50 } },
      { "name": "purok", "type": "text", "options": { "max": 100 } },
      { "name": "head_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "address", "type": "text", "options": { "max": 500 } },
      { "name": "notes", "type": "text", "options": { "max": 2000 } }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_households_number ON households (household_number)",
      "CREATE INDEX idx_households_purok ON households (purok)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  }
]
```

- [ ] **Step 2: Create the directory if needed, then save the file**

Make sure the directory `pocketbase/migrations` exists, then write the JSON.
