# Provider adapter contract

The server loads one adapter per service from `server/providers/<service>/<name>.js`,
where `<name>` matches the corresponding `*_PROVIDER` environment variable.

An adapter can export:

- `search(payload, context)` for `POST /api/search/<service>`
- `book(payload, context)` is the planned adapter contract for `POST /api/bookings/<service>`.

The current server deliberately rejects every booking request with
`REAL_BOOKING_DISABLED`, even if a provider is configured. Enabling real bookings
requires a deliberate code change after the provider, user authorization, and secure
booking confirmation flow are ready.

Keep provider credentials in the server environment. Never put secrets in browser
files or log passport details, payment data, or full provider requests. Validate and
minimize passenger data before forwarding it. The existing demo UI stays in demo
mode until a provider adapter and a real booking flow are deliberately connected.
