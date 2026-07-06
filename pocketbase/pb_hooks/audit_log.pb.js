/// <reference path="../pb_data/types.d.ts" />

const AUDITED_COLLECTIONS = [
  "residents",
  "households",
  "document_requests",
  "blotter_records",
  "visitor_logs",
  "meetings",
  "agenda_items",
  "calendar_events",
  "assets",
  "system_settings",
  "income_accounts",
  "revenues",
  "fund_sources",
  "appropriations",
  "disbursements",
]

function writeAuditLog(dao, e, action) {
  if (!AUDITED_COLLECTIONS.includes(e.collection.name)) return

  const user = e.httpContext?.auth ?? null
  const userName = user?.get("name") ?? user?.get("email") ?? "System"

  const record = e.record
  let details = `${action}d ${e.collection.name}`
  const nameFields = ["name", "title", "first_name", "head_name", "visitor_name", "case_number", "queue_number", "household_number"]
  for (const f of nameFields) {
    const val = record?.get(f)
    if (val && typeof val === "string") {
      details = `${action}d ${e.collection.name}: ${val}`
      break
    }
  }

  const logCollection = dao.findCollectionByNameOrId("activity_logs")
  if (!logCollection) return

  const logRecord = new Record(logCollection, {
    action: action,
    collection: e.collection.name,
    record_id: record?.id ?? "",
    details: details,
    user_name: userName,
  })

  try {
    dao.saveRecord(logRecord)
  } catch (_) {}
}

onRecordAfterCreate((e) => { writeAuditLog(e.dao, e, "create") })
onRecordAfterUpdate((e) => { writeAuditLog(e.dao, e, "update") })
onRecordAfterDelete((e) => { writeAuditLog(e.dao, e, "delete") })
