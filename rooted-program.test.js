const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const RP = require("./rooted-program.js");

const NIV_LINES = [
  "Your word is a lamp for my feet, a light on my path.",
  "For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
  "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
  "As the Father has loved me, so have I loved you. Now remain in my love.",
  "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
  "And over all these virtues put on love, which binds them all together in perfect unity.",
  "If it is possible, as far as it depends on you, live at peace with everyone.",
  "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters,",
  "Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.",
  "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace in its various forms.",
  "For physical training is of some value, but godliness has value for all things, holding promise for both the present life and the life to come.",
  "For we brought nothing into the world, and we can take nothing out of it.",
  "For just as each of us has one body with many members, and these members do not all have the same function,",
  "And surely I am with you always, to the very end of the age."
];

test("Level 1 publishes exactly twelve weeks and no other level content", () => {
  assert.equal(RP.WEEKS.length, 12);
  assert.deepEqual(RP.WEEKS.map((w) => w.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(RP.LEVELS.length, 6);
  assert.deepEqual(RP.LEVELS.filter((l) => l.available).map((l) => l.id), [1]);
  RP.LEVELS.slice(1).forEach((level) => {
    assert.equal(level.available, false);
    assert.equal(level.weeks, undefined);
    assert.match(level.summary, /No lessons/i);
  });
});

test("every week has a passage, a separated reading guide, and a small practice", () => {
  RP.WEEKS.forEach((week) => {
    assert.match(week.passage, /\d+:\d+/);
    assert.match(week.passageLoad, /\d+:\d+/);
    assert.equal(week.translation, "NIV");
    assert.match(week.keyVerse, /\d+:\d+/);
    ["plainSense", "text", "interpretation", "practiceNote", "prayer", "action"].forEach((key) => {
      assert.equal(typeof week[key], "string");
      assert.ok(week[key].trim().length > 40, week.title + " missing " + key);
    });
    assert.ok(week.prompts.length >= 4 && week.prompts.length <= 6);
    week.prompts.forEach((prompt) => assert.equal(typeof prompt, "string"));
    assert.equal(week.plainSense.includes("“"), false);
  });
});

test("the course does not embed the draft's NIV quotations", () => {
  const packed = JSON.stringify(RP.WEEKS) + JSON.stringify(RP.LEVELS);
  NIV_LINES.forEach((line) => assert.equal(packed.includes(line), false, line));
  assert.equal(/used by permission/i.test(packed), false);
  assert.equal(/north coast church curriculum/i.test(packed), false);
  assert.equal(packed.toLowerCase().includes("official north coast"), false);
});

test("sensitive weeks keep their limits", () => {
  const byN = Object.fromEntries(RP.WEEKS.map((w) => [w.n, w]));
  assert.match(byN[5].interpretation, /unsafe/i);
  assert.match(byN[6].interpretation, /abus/i);
  assert.match(byN[7].interpretation, /not an endorsement of slavery/i);
  assert.match(byN[9].interpretation, /not medical|does not promise a health/i);
  assert.match(byN[9].caution, /not medical advice/i);
  assert.match(byN[10].interpretation, /does not promise/i);
  assert.match(byN[10].action, /Do not enter amounts/i);
  assert.match(byN[11].interpretation, /not a prophecy/i);
  assert.match(byN[12].interpretation, /does not qualify anyone to lead/i);
  assert.match(byN[12].caution, /does not open Level 2/i);
});

test("a planted rank, certification, and reflection cannot survive normalization", () => {
  const planted = RP.normalize({
    optedIn: true,
    level: 6,
    rank: "Multiplying",
    certifiedLeader: true,
    reflections: { 1: "SECRET_REFLECTION" },
    steps: {
      1: { read: true, note: "SECRET_REFLECTION" },
      12: { read: true, reflect: true, pray: true, practice: "SECRET_REFLECTION" }
    }
  });
  assert.equal(planted.optedIn, true);
  assert.equal(planted.steps[1].read, true);
  assert.equal(planted.steps[1].note, undefined);
  assert.equal(planted.reflections, undefined);
  assert.equal(planted.rank, undefined);
  assert.equal(planted.certifiedLeader, undefined);
  assert.equal(planted.steps[12].practice, false);
  assert.equal(RP.courseCoreComplete(planted), false);
});

test("every week has mentor guidance separate from the lesson", () => {
  assert.deepEqual(RP.MENTOR_AGENDA.map((item) => item.key), ["scripture", "application", "challenges", "prayer", "nextStep"]);
  RP.WEEKS.forEach((week) => {
    RP.MENTOR_AGENDA.forEach((item) => {
      assert.equal(typeof week.mentor[item.key], "string");
      assert.ok(week.mentor[item.key].trim().length > 40, week.title + " mentor " + item.key);
    });
    assert.ok(week.mentor.limit.trim().length > 20);
    const packed = JSON.stringify(week.mentor);
    assert.equal(/transcript|recording|zoom\.us|mentor directory|type what he said/i.test(packed), false);
  });
  const byN = Object.fromEntries(RP.WEEKS.map((w) => [w.n, w]));
  assert.match(byN[5].mentor.limit, /harm/i);
  assert.match(byN[6].mentor.limit, /911/);
  assert.match(byN[7].mentor.limit, /coercion/i);
  assert.match(byN[9].mentor.limit, /medical advice/i);
  assert.match(byN[10].mentor.limit, /dollar amounts/i);
  assert.match(byN[11].mentor.limit, /life assignment/i);
  assert.match(byN[12].mentor.limit, /Level 2/);
});

test("a meeting record cannot wipe lesson progress or keep conversation notes", () => {
  const kept = RP.normalize({
    optedIn: true,
    steps: {
      1: { read: true, reflect: true, pray: false, practice: false, note: "SECRET_REFLECTION", mentorMet: true, mentorMode: "zoom", meeting: { mode: "https://zoom.us/j/secret", met: true, notes: "SECRET_REFLECTION" } },
      4: { read: true, reflect: true, pray: true, practice: true }
    },
    meetings: { 1: { mode: "in-person", met: true, notes: "SECRET_REFLECTION", mentorName: "Pat", url: "https://zoom.us/j/1" } }
  });
  assert.equal(kept.steps[1].read, true);
  assert.equal(kept.steps[1].reflect, true);
  assert.equal(kept.steps[1].pray, false);
  assert.equal(kept.steps[1].practice, false);
  assert.equal(kept.meetings[1].mode, "in-person");
  assert.equal(kept.meetings[1].met, true);
  assert.equal(kept.meetings[1].notes, undefined);
  assert.equal(JSON.stringify(kept).includes("SECRET_REFLECTION"), false);
  assert.equal(JSON.stringify(kept).includes("zoom.us"), false);
  assert.equal(JSON.stringify(kept).includes("Pat"), false);
  assert.equal(RP.weekCoreComplete(kept, 4), true);
  assert.equal(RP.weekMeetingComplete(kept, 4), false);
  assert.equal(RP.courseCoreComplete(kept), false);
});

test("lesson completion and mentor attendance stay separate and do not promote", () => {
  const steps = {};
  const meetings = {};
  for (let n = 1; n <= 12; n++) {
    steps[n] = { read: true, reflect: true, pray: true, practice: true };
    meetings[n] = { mode: "", met: false };
  }
  const lessonsOnly = RP.normalize({ optedIn: true, steps, meetings });
  assert.equal(RP.courseCoreComplete(lessonsOnly), true);
  assert.equal(RP.meetingsMarkedCount(lessonsOnly), 0);
  assert.equal(RP.promotion(lessonsOnly).promoted, false);
  const meetingsOnly = RP.normalize({
    optedIn: true,
    meetings: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, { mode: "zoom", met: true }]))
  });
  assert.equal(RP.courseCoreComplete(meetingsOnly), false);
  assert.equal(RP.meetingsMarkedCount(meetingsOnly), 12);
  assert.equal(meetingsOnly.steps[3].read, false);
  const both = RP.normalize({
    optedIn: true,
    steps,
    meetings: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, { mode: "in-person", met: true, notes: "SECRET_REFLECTION" }]))
  });
  assert.equal(RP.weeksWithBothCount(both), 12);
  assert.equal(RP.promotion(both).promoted, false);
  assert.equal(RP.promotion(both).certifiedLeader, false);
  assert.equal(JSON.stringify(RP.publicSnapshot(both)).includes("SECRET_REFLECTION"), false);
  assert.match(RP.shareLine(both), /self-reported mentor meetings/);
  assert.match(RP.shareLine(both), /No rank or leadership status/);
  assert.equal(RP.shareLine(both).includes("SECRET_REFLECTION"), false);
});

test("finishing every check-in does not promote or certify", () => {
  const steps = {};
  for (let n = 1; n <= 12; n++) steps[n] = { read: true, reflect: true, pray: true, practice: true };
  const done = RP.normalize({ optedIn: true, steps: steps, rank: "leader" });
  assert.equal(RP.courseCoreComplete(done), true);
  const outcome = RP.promotion(done);
  assert.equal(outcome.promoted, false);
  assert.equal(outcome.rank, null);
  assert.equal(outcome.certifiedLeader, false);
  assert.equal(outcome.nextLevel, null);
  assert.equal(RP.levelAvailable(1), true);
  assert.equal(RP.levelAvailable(2), false);
  assert.equal(RP.levelAvailable(6), false);
  const pub = RP.publicSnapshot(done);
  assert.equal(JSON.stringify(pub).includes("SECRET"), false);
  assert.equal(pub.promoted, false);
  assert.equal(pub.certifiedLeader, false);
  assert.deepEqual(pub.openLevels, [1]);
  assert.match(RP.shareLine(done), /No rank or leadership status/);
});

test("an opted-out man has an empty public check-in", () => {
  const snap = RP.publicSnapshot(null);
  assert.equal(snap.optedIn, false);
  assert.equal(snap.weeksComplete, 0);
  assert.equal(snap.coreComplete, false);
  assert.match(RP.shareLine(null), /No check-in is recorded/);
});

test("the SQL file is owner-only and does not enroll anyone", () => {
  const sql = fs.readFileSync(path.join(__dirname, "supabase/db/discipleship.sql"), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /force row level security/i);
  assert.match(sql, /revoke all on table public\.discipleship_progress from public, anon/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.discipleship_progress to authenticated/i);
  assert.equal((sql.match(/auth\.uid\(\) = user_id/g) || []).length >= 4, true);
  assert.equal(/for select using \(\s*true\s*\)/i.test(sql), false);
  assert.equal(/to anon/i.test(sql), false);
  assert.equal(/insert into public\.discipleship_progress/i.test(sql), false);
  assert.match(sql, /on delete cascade/i);
  assert.match(sql, /reflections/i);
  assert.match(sql, /meetings\s+jsonb/i);
  assert.match(sql, /add column if not exists meetings/i);
  assert.match(sql, /Do not add mentor names, links, notes, recordings, or transcripts/i);
  assert.equal(/mentor_name|recording_url|conversation_notes/i.test(sql), false);
  ["select", "insert", "update", "delete"].forEach((action) => {
    assert.match(sql, new RegExp("for " + action, "i"));
  });
});
