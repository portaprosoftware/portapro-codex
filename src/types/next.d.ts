declare module "next/server" {
  export interface NextRequest {
    headers: Headers;
    nextUrl: URL;
  }

  export const NextResponse: {
    next: (init?: { request?: { headers?: Headers } }) => Response;
    redirect: (url: string | URL, status?: number) => Response;
    json: (body: unknown, init?: ResponseInit) => Response;
  };
}

declare module "next/navigation" {
  export function redirect(url: string | URL): never;
}

declare module "next/headers" {
  export function headers(): Headers;
}
