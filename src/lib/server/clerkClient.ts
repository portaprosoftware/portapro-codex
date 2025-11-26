import { loadServerEnv } from "@/lib/config/env";

const CLERK_API_BASE = "https://api.clerk.com/v1";

const buildHeaders = () => {
  const env = loadServerEnv();

  return {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  let payload: any = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.errors?.[0]?.message || payload?.error || response.statusText;
    throw new Error(message || "Clerk request failed");
  }

  return payload;
};

export const clerkClient = {
  users: {
    async createUser(params: {
      emailAddress: string[];
      firstName: string;
      lastName: string;
      phoneNumbers?: { phoneNumber: string }[];
      publicMetadata?: Record<string, unknown>;
    }) {
      const response = await fetch(`${CLERK_API_BASE}/users`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          email_address: params.emailAddress,
          first_name: params.firstName,
          last_name: params.lastName,
          phone_numbers: params.phoneNumbers?.map((phone) => phone.phoneNumber),
          public_metadata: params.publicMetadata,
        }),
      });

      return handleResponse(response);
    },

    async deleteUser(userId: string) {
      const response = await fetch(`${CLERK_API_BASE}/users/${userId}`, {
        method: "DELETE",
        headers: buildHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to delete Clerk user", text);
      }
    },
  },

  invitations: {
    async createInvitation(params: {
      emailAddress: string;
      publicMetadata?: Record<string, unknown>;
      redirectUrl?: string;
    }) {
      const response = await fetch(`${CLERK_API_BASE}/invitations`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          email_address: params.emailAddress,
          public_metadata: params.publicMetadata,
          redirect_url: params.redirectUrl,
        }),
      });

      return handleResponse(response);
    },

    async revokeInvitation(invitationId: string) {
      const response = await fetch(`${CLERK_API_BASE}/invitations/${invitationId}/revoke`, {
        method: "POST",
        headers: buildHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to revoke Clerk invitation", text);
      }
    },
  },
};

export const verifyClerkSessionToken = async (token: string) => {
  const response = await fetch(`${CLERK_API_BASE}/client/sessions/verify`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ token }),
  });

  const payload = await handleResponse(response);
  const userId = payload?.response?.user_id || payload?.user_id || payload?.sub;

  if (!userId) {
    throw new Error("Unable to determine user from session token");
  }

  return { userId, session: payload };
};
