// Shared hour/minute <select> option lists for the date+hour+minute
// picker pattern used wherever a 選考予定 datetime is entered (StageForm,
// and the optional initial one on CompanyForm) — plain selects instead of
// a native datetime-local widget, whose time-of-day picker is fiddly to
// use with a mouse.
export const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
export const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
