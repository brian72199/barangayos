/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCol = app.findCollectionByNameOrId("users")
  const mutableCollections = ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]
  const adminOrOwn = '@request.auth.role = "admin" || (@request.auth.role = "staff" && @request.auth.id = created_by)'

  for (const name of mutableCollections) {
    const col = app.findCollectionByNameOrId(name)

    // Add created_by field if not already present
    const hasField = col.fields.some((f) => f.name === "created_by")
    if (!hasField) {
      col.fields.add(new RelationField({
        name: "created_by",
        collectionId: usersCol.id,
        maxSelect: 1,
        cascadeDelete: false,
      }))
    }

    // Update updateRule with ownership check (fund_sources stays admin-only from migration 017)
    if (name !== "fund_sources") {
      col.updateRule = adminOrOwn
    }

    app.save(col)
  }
}, (app) => {
  const origUpdate = '@request.auth.role = "admin" || @request.auth.role = "staff"'
  const names = ["income_accounts", "revenues", "fund_sources", "appropriations", "disbursements"]
  for (const name of names) {
    const col = app.findCollectionByNameOrId(name)
    col.updateRule = origUpdate
    app.save(col)
  }
})
