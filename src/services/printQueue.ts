import { sendToPrinter } from './printer';

export type JobStatus = 'pending' | 'in-progress' | 'done' | 'failed' | 'canceled';

export interface PrintJob {
  id: string;
  name?: string;
  ip: string;
  port?: number;
  zpl: string;
  status: JobStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'print_jobs_v1';
let processing = false;

const now = () => new Date().toISOString();

function listStored(): PrintJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrintJob[];
  } catch {
    return [];
  }
}

function saveStored(jobs: PrintJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function listJobs(): PrintJob[] {
  return listStored().sort((a,b) => a.createdAt.localeCompare(b.createdAt));
}

export function enqueueJob(ip: string, zpl: string, name?: string, port = 9100): PrintJob {
  const jobs = listStored();
  const job: PrintJob = { id: crypto.randomUUID(), name, ip, port, zpl, status: 'pending', attempts: 0, createdAt: now(), updatedAt: now() };
  jobs.push(job);
  saveStored(jobs);
  processQueue();
  return job;
}

export function updateJob(id: string, patch: Partial<PrintJob>) {
  const jobs = listStored();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...patch, updatedAt: now() };
  saveStored(jobs);
  return jobs[idx];
}

export function removeJob(id: string) {
  const jobs = listStored().filter(j => j.id !== id);
  saveStored(jobs);
}

export async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    const jobs = listStored();
    const pending = jobs.find(j => j.status === 'pending');
    if (!pending) return;
    updateJob(pending.id, { status: 'in-progress', attempts: pending.attempts + 1 });
    const current = listStored().find(j => j.id === pending.id)!;
    try {
      const res = await sendToPrinter(current.ip, current.zpl, current.port ?? 9100);
      if (res.ok) {
        updateJob(current.id, { status: 'done', lastError: undefined });
      } else {
        updateJob(current.id, { status: 'failed', lastError: res.reason });
      }
    } catch (err: any) {
      updateJob(current.id, { status: 'failed', lastError: String(err?.message ?? err) });
    }
    // process next after small delay
    setTimeout(() => {
      processing = false;
      processQueue();
    }, 250);
  } finally {
    processing = false;
  }
}

export function retryJob(id: string) {
  const job = updateJob(id, { status: 'pending', lastError: undefined });
  if (job) processQueue();
}

export function clearJobs() {
  saveStored([]);
}
