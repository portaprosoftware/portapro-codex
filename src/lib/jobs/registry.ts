import { JobHandler } from './types';

type Registry = Map<string, JobHandler>;

const registry: Registry = new Map();

export const registerJob = (type: string, handler: JobHandler) => {
  registry.set(type, handler);
};

export const getJobHandler = (type: string) => registry.get(type);

export const clearRegistry = () => registry.clear();
