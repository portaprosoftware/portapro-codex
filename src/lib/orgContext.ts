interface OrgContextState {
  organizationId: string | null;
  orgSlug: string | null;
}

const globalKey = "__PORTAPRO_ORG_CONTEXT__";

const getStore = (): OrgContextState => {
  const globalScope = globalThis as unknown as Record<string, OrgContextState | undefined>;
  if (!globalScope[globalKey]) {
    globalScope[globalKey] = { organizationId: null, orgSlug: null };
  }
  return globalScope[globalKey]!;
};

export const setOrgContext = (context: Partial<OrgContextState>) => {
  const store = getStore();
  store.organizationId = context.organizationId ?? store.organizationId;
  store.orgSlug = context.orgSlug ?? store.orgSlug;
};

export const clearOrgContext = () => {
  const store = getStore();
  store.organizationId = null;
  store.orgSlug = null;
};

export const getOrgContext = (): OrgContextState => {
  return getStore();
};

export const resolveOrgId = (orgId?: string | null): string | null => {
  const resolved = orgId ?? getStore().organizationId;
  return resolved ?? null;
};

export const resolveOrgSlug = (slug?: string | null): string | null => {
  const resolved = slug ?? getStore().orgSlug;
  return resolved ?? null;
};
