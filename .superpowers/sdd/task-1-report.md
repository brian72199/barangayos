# Task 1 Report: Migration JSON + Cloudinary utility

**Status:** DONE

## Files Created/Modified

| File | Action |
|------|--------|
| `pocketbase/migrations/004_assets_calendar_agenda.json` | Created — 4 collections: assets, calendar_events, meetings, agenda_items |
| `src/api/upload.ts` | Created — `uploadImage(file: File): Promise<string>` |
| `.env.local` | Modified — added `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` |
| `.env.local.example` | Modified — same additions |
| `.env.production` | Modified — same additions |
| `.env.production.example` | Modified — same additions |

## Migration Details

- **assets**: 13 fields (name, asset_type, description, serial_number, purchase_date, purchase_cost, current_value, condition, status, assigned_to, location, image_url, notes). Indexes on asset_type, condition, status. Admin-only access.
- **calendar_events**: 9 fields (title, description, event_type, start_datetime, end_datetime, all_day, location, agenda_ref, notes). Indexes on start_datetime, event_type. Authenticated list/view; admin/staff write.
- **meetings**: 6 fields (title, meeting_date, location, meeting_type, status, notes). Indexes on meeting_date, status. Admin/staff only.
- **agenda_items**: 8 fields (meeting_id with cascade delete, title, description, sort_order, status, minutes, submitted_by, submitted_at). Indexes on meeting_id, sort_order. Admin/staff only.

## Build Result

`npm run build` — passed (tsc + vite, 1880 modules, 418ms)

## Commit

```
3e94967 feat: add Group D migration for assets/calendar/agenda + Cloudinary upload utility
```
