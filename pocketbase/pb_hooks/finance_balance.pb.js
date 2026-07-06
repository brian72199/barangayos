/// <reference path="../pb_data/types.d.ts" />

function getFundSource(dao, fundSourceId) {
  const col = dao.findCollectionByNameOrId("fund_sources")
  return dao.findRecordById(col, fundSourceId)
}

function getAppropriation(dao, appropId) {
  const col = dao.findCollectionByNameOrId("appropriations")
  return dao.findRecordById(col, appropId)
}

onRecordAfterCreate((e) => {
  if (e.collection.name !== "disbursements") return

  try {
    const disbursement = e.record
    const appr = getAppropriation(e.dao, disbursement.get("appropriation"))
    if (!appr) return

    const amount = disbursement.get("amount") || 0
    const currentDisbursed = appr.get("disbursed_amount") || 0
    const newDisbursed = currentDisbursed + amount

    appr.set("disbursed_amount", newDisbursed)
    if (newDisbursed >= (appr.get("appropriated_amount") || 0)) {
      appr.set("fully_disbursed_date", new Date().toISOString().split("T")[0])
    } else {
      appr.set("fully_disbursed_date", appr.get("fully_disbursed_date") || "")
    }
    e.dao.saveRecord(appr)

    // Deduct fund source balance
    const fundSourceId = appr.get("fund_source")
    if (fundSourceId) {
      const fs = getFundSource(e.dao, fundSourceId)
      if (fs) {
        fs.set("current_balance", (fs.get("current_balance") || 0) - amount)
        e.dao.saveRecord(fs)
      }
    }
  } catch (_) {}
})

onRecordAfterDelete((e) => {
  if (e.collection.name !== "disbursements") return

  try {
    const disbursement = e.record
    const appr = getAppropriation(e.dao, disbursement.get("appropriation"))
    if (!appr) return

    const amount = disbursement.get("amount") || 0
    const currentDisbursed = appr.get("disbursed_amount") || 0
    const newDisbursed = Math.max(0, currentDisbursed - amount)

    appr.set("disbursed_amount", newDisbursed)
    appr.set("fully_disbursed_date", newDisbursed > 0 ? (appr.get("fully_disbursed_date") || "") : "")
    e.dao.saveRecord(appr)

    // Restore fund source balance
    const fundSourceId = appr.get("fund_source")
    if (fundSourceId) {
      const fs = getFundSource(e.dao, fundSourceId)
      if (fs) {
        fs.set("current_balance", (fs.get("current_balance") || 0) + amount)
        e.dao.saveRecord(fs)
      }
    }
  } catch (_) {}
})
