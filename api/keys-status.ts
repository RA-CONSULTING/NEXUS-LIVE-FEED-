const KEYS = ["SUPABASE_URL","SUPABASE_ANON_KEY","NOAA_CDO_TOKEN","NASA_API_KEY","USGS_API_KEY"];

export default async () => {
  const body = Object.fromEntries(
    KEYS.map(k => [k, { present: !!process.env[k], masked: mask(process.env[k]||"") }])
  );
  return new Response(JSON.stringify(body), { headers: { "content-type":"application/json" }});
};

function mask(v:string){ return v ? `${v.slice(0,4)}…${v.slice(-4)} (len=${v.length})` : "(missing)"; }
