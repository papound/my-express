import { getActiveCompanyId, getDataMode } from "@/lib/dbf/company-context";

export const ALLOWED_WRITE_COMPANY = "WriteTes";

export interface JenkinsWriteResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

/**
 * Trigger the Jenkins `express-write-quotation` pipeline for the WriteTes sandbox
 * and poll until completion, returning the parsed JSON result from the build log.
 */
export async function triggerExpressQuotationWrite(
  payload: Record<string, unknown>
): Promise<JenkinsWriteResult> {
  const activeMode = await getDataMode();
  if (activeMode !== "realtime") {
    return {
      ok: false,
      status: 403,
      data: {
        ok: false,
        error: "Write operations are disabled in Snapshot mode (Read-Only).",
      },
    };
  }

  const activeCompany = await getActiveCompanyId(activeMode);
  if (activeCompany !== ALLOWED_WRITE_COMPANY) {
    return {
      ok: false,
      status: 403,
      data: {
        ok: false,
        error: `Write mode is restricted to '${ALLOWED_WRITE_COMPANY}' sandbox (active: '${activeCompany}').`,
      },
    };
  }

  const jenkinsUrl = (process.env.JENKINS_URL || "").replace(/\/+$/, "");
  const jenkinsUser = process.env.JENKINS_USER || "";
  const jenkinsToken = process.env.JENKINS_API_TOKEN || "";
  const jenkinsJob = process.env.JENKINS_QT_JOB || "express-write-quotation";

  if (!jenkinsUrl || !jenkinsUser || !jenkinsToken) {
    return {
      ok: false,
      status: 500,
      data: {
        ok: false,
        error:
          "Missing Jenkins configuration (JENKINS_URL, JENKINS_USER, JENKINS_API_TOKEN).",
      },
    };
  }

  const authHeader =
    "Basic " + Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString("base64");
  const headers: Record<string, string> = { Authorization: authHeader };

  try {
    const crumbRes = await fetch(`${jenkinsUrl}/crumbIssuer/api/json`, {
      headers,
    });
    if (crumbRes.ok) {
      const crumbData = (await crumbRes.json()) as {
        crumbRequestField?: string;
        crumb?: string;
      };
      if (crumbData.crumbRequestField && crumbData.crumb) {
        headers[crumbData.crumbRequestField] = crumbData.crumb;
      }
    }
  } catch {
    // Crumb issuer may be disabled
  }

  const fullPayload = { ...payload, company: ALLOWED_WRITE_COMPANY };
  const form = new URLSearchParams({
    PAYLOAD_JSON: JSON.stringify(fullPayload),
  });

  const triggerRes = await fetch(
    `${jenkinsUrl}/job/${encodeURIComponent(jenkinsJob)}/buildWithParameters`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );

  if (!triggerRes.ok && triggerRes.status !== 201) {
    const errText = await triggerRes.text();
    return {
      ok: false,
      status: 502,
      data: {
        ok: false,
        error: `Jenkins trigger failed (${triggerRes.status}): ${errText.slice(0, 300)}`,
      },
    };
  }

  const queueLocation = triggerRes.headers.get("location");
  if (!queueLocation) {
    return {
      ok: false,
      status: 502,
      data: { ok: false, error: "Jenkins did not return a queue location." },
    };
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let buildUrl: string | null = null;

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const qRes = await fetch(`${queueLocation.replace(/\/+$/, "")}/api/json`, {
      headers: { Authorization: authHeader },
    });
    if (qRes.ok) {
      const qJson = (await qRes.json()) as {
        executable?: { url?: string };
        cancelled?: boolean;
      };
      if (qJson.cancelled) {
        return {
          ok: false,
          status: 502,
          data: { ok: false, error: "Jenkins build was cancelled in queue." },
        };
      }
      if (qJson.executable?.url) {
        buildUrl = qJson.executable.url.replace(/\/+$/, "");
        break;
      }
    }
  }

  if (!buildUrl) {
    return {
      ok: false,
      status: 504,
      data: { ok: false, error: "Timed out waiting for Jenkins executor." },
    };
  }

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const bRes = await fetch(`${buildUrl}/api/json`, {
      headers: { Authorization: authHeader },
    });
    if (bRes.ok) {
      const bJson = (await bRes.json()) as {
        building?: boolean;
        result?: string;
      };
      if (!bJson.building) {
        const logRes = await fetch(`${buildUrl}/consoleText`, {
          headers: { Authorization: authHeader },
        });
        const logText = logRes.ok ? await logRes.text() : "";
        const match = logText.match(/EXPRESS_WRITE_RESULT=(\{.*\})/);
        if (match) {
          const parsed = JSON.parse(match[1]) as Record<string, unknown>;
          return {
            ok: Boolean(parsed.ok),
            status: parsed.ok ? 200 : 400,
            data: parsed,
          };
        }
        return {
          ok: false,
          status: bJson.result === "SUCCESS" ? 200 : 502,
          data: {
            ok: false,
            error: `Jenkins build finished with ${bJson.result || "UNKNOWN"}`,
          },
        };
      }
    }
  }

  return {
    ok: false,
    status: 504,
    data: { ok: false, error: "Timed out waiting for Jenkins build completion." },
  };
}
