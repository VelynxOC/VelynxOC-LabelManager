import { sendToPrinter } from './printer';
import { notify } from './toast';

export type JobStatus = 'pending' | 'in-progress' | 'done' | 'failed' | 'canceled';

export interface PrintJob {
  id: string;
  name?: string;
  ip: string;
  port?: number;
  priority?: number;
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

export function countPending(): number {
  return listStored().filter(j => j.status === 'pending').length;
}

export function enqueueJob(ip: string, zpl: string, name?: string, port = 9100, priority = 0): PrintJob {
  const jobs = listStored();
  const job: PrintJob = { id: crypto.randomUUID(), name, ip, port, zpl, status: 'pending', attempts: 0, createdAt: now(), updatedAt: now(), priority };
  jobs.push(job);
  saveStored(jobs);
  notify(`Trabajo agregado a la cola (${name ?? job.id.slice(0,6)})`, 'info');
  processQueue();
  return job;
}

export function updateJob(id: string, patch: Partial<PrintJob>) {
  const jobs = listStored();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;
  const before = jobs[idx];
  jobs[idx] = { ...jobs[idx], ...patch, updatedAt: now() };
  const after = jobs[idx];
  // notify on status changes
  if (before.status !== after.status) {
    if (after.status === 'done') notify(`Trabajo ${after.name ?? after.id.slice(0,6)} completado`, 'success');
    if (after.status === 'failed') notify(`Trabajo ${after.name ?? after.id.slice(0,6)} falló: ${after.lastError ?? 'error'}`, 'error');
    if (after.status === 'canceled') notify(`Trabajo ${after.name ?? after.id.slice(0,6)} cancelado`, 'warn');
  }
  saveStored(jobs);
  return jobs[idx];
}

export function cancelJob(id: string) {
  const job = updateJob(id, { status: 'canceled' });
  return job;
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
    // pick highest priority pending (higher number = higher priority), then oldest
    const pendingList = jobs.filter(j => j.status === 'pending');
    if (pendingList.length === 0) return;
    pendingList.sort((a,b) => (b.priority ?? 0) - (a.priority ?? 0) || a.createdAt.localeCompare(b.createdAt));
    const pending = pendingList[0];
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
