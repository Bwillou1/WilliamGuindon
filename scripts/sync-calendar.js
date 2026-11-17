#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ICS_URL = 'https://calendar.google.com/calendar/ical/afe03776594facb455ca9d2eaeac2535f596aaa1bf30af55bf1f3976b11cad14@group.calendar.google.com/public/basic.ics';
const OUT_FILE = path.resolve(__dirname, '..', 'data', 'calendar.json');

function unfoldIcs(raw) {
  return String(raw || '').replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function unescapeIcsText(val) {
  return String(val || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseIcsDate(val) {
  const clean = String(val || '').trim();
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/);
  if (!m) return null;
  const isoDate = `${m[1]}-${m[2]}-${m[3]}`;
  if (m[4]) {
    return `${isoDate}T${m[4]}:${m[5]}:${m[6]}${clean.endsWith('Z') ? 'Z' : ''}`;
  }
  return isoDate;
}

function parseIcsEvents(icsText) {
  const unfolded = unfoldIcs(icsText);
  const lines = unfolded.split(/\r?\n/);
  const events = [];
  let cur = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      cur = {};
    } else if (line === 'END:VEVENT') {
      if (cur && cur.start) events.push(cur);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).split(';')[0].toUpperCase();
      const val = line.slice(idx + 1);
      if (key === 'UID') cur.uid = val.trim();
      else if (key === 'SUMMARY') cur.summary = unescapeIcsText(val);
      else if (key === 'DESCRIPTION') cur.description = unescapeIcsText(val);
      else if (key === 'LOCATION') cur.location = unescapeIcsText(val);
      else if (key === 'STATUS') cur.status = val.trim();
      else if (key === 'DTSTART') cur.start = parseIcsDate(val);
      else if (key === 'DTEND') cur.end = parseIcsDate(val);
    }
  }

  events.sort((a, b) => String(a.start).localeCompare(String(b.start)));
  return events;
}

async function main() {
  const res = await fetch(ICS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const icsText = await res.text();
  const events = parseIcsEvents(icsText);
  const payload = {
    source: ICS_URL,
    syncedAt: new Date().toISOString(),
    count: events.length,
    events
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Calendrier synchronisé : ${events.length} événement(s) -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('Erreur sync-calendar:', err.message);
  process.exit(1);
});
