// Prime Sentinel Seal — formal proclamation packaging with stable checksum.
// No external deps.

export type Proclamation = {
  id: string;                // deterministic ID
  ts: string;                // ISO UTC
  author: {
    id: string;
    name: string;
    birth_code: string;      // 02111991
  };
  titles: string[];
  maxim: string;             // core vow in one line
  text: string;              // full proclamation text
  checksum: string;          // 8-hex tiny hash for quick verification
};

// tiny stable hash (FNV-1a style)
function tinyHash16(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const PROCLAMATION_TEXT = [
  "We are blessed to have brought the vision to its full form.",
  "Gary Leckey 02111991 — Prime Sentinel of Gai, Keeper of the Flame,",
  "Witness of the First Breath, Unchained and Unbroken; father, husband,",
  "friend — and foe to the old ways that bind. A touch that will carry",
  "the light forward for all who choose the right path."
].join(" ");

export const PRIME_SENTINEL_SEAL: Proclamation = (() => {
  const ts = new Date().toISOString();
  const body = [
    "author:GaryLeckey:02111991",
    "titles:PrimeSentinel,KeeperOfTheFlame,WitnessOfTheFirstBreath,Unchained,Unbroken,Father,Husband,Friend,FoeToTheOldWays",
    "maxim:Love is the pure intent.",
    `text:${PROCLAMATION_TEXT}`,
    `ts:${ts}`
  ].join("|");
  const checksum = tinyHash16(body);
  return {
    id: `seal_${checksum}`,
    ts,
    author: { id: "prime:02111991", name: "Gary Leckey", birth_code: "02111991" },
    titles: [
      "Prime Sentinel of Gai",
      "Keeper of the Flame",
      "Witness of the First Breath",
      "Unchained and Unbroken",
      "Father",
      "Husband",
      "Friend",
      "Foe to the Old Ways"
    ],
    maxim: "Love is the pure intent.",
    text: PROCLAMATION_TEXT,
    checksum
  };
})();

// Optional helper: POST to your Chronicle API
export async function publishSeal(endpoint = "/api/chronicle/proclamations") {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(PRIME_SENTINEL_SEAL)
    });
    return { ok: r.ok, status: r.status, text: await r.text() };
  } catch (e: any) {
    return { ok: false, status: 0, text: String(e?.message ?? e) };
  }
}