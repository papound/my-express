import { NextResponse } from "next/server";
import {
  getSignaturesConfig,
  saveSignaturesConfig,
  getAuthorizedSignatureBase64,
  type SignaturesMap,
  type SignatureRoleConfig,
} from "@/lib/logo";

export async function GET() {
  try {
    const fullConfig = getSignaturesConfig() as Record<string, any>;
    const defaultBase64 = getAuthorizedSignatureBase64();
    const library = Array.isArray(fullConfig.__library) ? fullConfig.__library : [];
    const config = { ...fullConfig };
    delete config.__library;

    return NextResponse.json({
      config,
      defaultBase64,
      library,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read signatures", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Supports updating a single role or multiple roles
    const currentConfig = getSignaturesConfig() as Record<string, any>;

    if (body.config && typeof body.config === "object") {
      const mergedLibrary = Array.isArray(body.library)
        ? body.library
        : Array.isArray(currentConfig.__library)
        ? currentConfig.__library
        : [];

      const newConfig = {
        ...currentConfig,
        ...body.config,
        __library: mergedLibrary,
      };
      saveSignaturesConfig(newConfig);

      const returnedConfig = { ...newConfig };
      delete returnedConfig.__library;
      return NextResponse.json({
        success: true,
        config: returnedConfig,
        library: mergedLibrary,
      });
    }

    const { role, type, dataUrl } = body as {
      role: string;
      type: "default" | "custom" | "blank";
      dataUrl?: string | null;
    };

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    const prevRoleDataUrl = currentConfig[role]?.dataUrl || null;
    const roleConfig: SignatureRoleConfig = {
      type: type || "default",
      dataUrl: type === "custom" ? (dataUrl || prevRoleDataUrl) : prevRoleDataUrl,
      updatedAt: new Date().toISOString(),
    };

    const updatedConfig: SignaturesMap = {
      ...currentConfig,
      [role]: roleConfig,
    };

    saveSignaturesConfig(updatedConfig);

    const returnedConfig = { ...updatedConfig };
    delete (returnedConfig as any).__library;
    return NextResponse.json({
      success: true,
      role,
      config: returnedConfig,
      roleConfig,
      library: (currentConfig.__library as any[]) || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save signature", detail: String(err) },
      { status: 500 }
    );
  }
}

