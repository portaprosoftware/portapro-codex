import type { NextApiRequest, NextApiResponse } from "next";
import { parseCsv } from "@/lib/imports/csvParser";
import { runImport } from "@/lib/imports/importOrchestrator";
import type { ImportType } from "@/lib/imports/validators";

const getBodyAsString = async (req: NextApiRequest): Promise<string> => {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");

  if (req.body?.csv) return String(req.body.csv);

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
};

export const createImportHandler = (type: ImportType) => async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const orgId = (req.headers["x-organization-id"] as string) ?? (req.query.orgId as string);
    const userId = (req.headers["x-user-id"] as string) ?? (req.query.userId as string);
    const csv = await getBodyAsString(req);
    const parsed = parseCsv(csv);

    const result = await runImport({
      type,
      orgId,
      userId,
      rows: parsed.rows,
    });

    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "Import failed",
      errors: [],
    });
  }
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};
