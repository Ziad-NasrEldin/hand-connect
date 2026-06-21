import type { AdminService } from './contracts/admin.contract';
import type { Profession } from '@/types/provider';
import { getDataSource } from './data-source';
import * as demo from './demo/admin.demo';
import { firebaseAdminService } from './firebase/admin.firebase';

const demoAdminService: AdminService = demo;

function adminService(): AdminService {
  return getDataSource() === 'firebase' ? firebaseAdminService : demoAdminService;
}

export async function getAdminOverview() {
  return adminService().getAdminOverview();
}

export async function listProviderApplications() {
  return adminService().listProviderApplications();
}

export async function listAllProviders() {
  return adminService().listAllProviders();
}

export async function approveProvider(adminId: string, providerId: string) {
  return adminService().approveProvider(adminId, providerId);
}

export async function rejectProvider(adminId: string, providerId: string, reason: string) {
  return adminService().rejectProvider(adminId, providerId, reason);
}

export async function suspendProvider(adminId: string, providerId: string, reason: string) {
  return adminService().suspendProvider(adminId, providerId, reason);
}

export async function approveVisibilityRequest(adminId: string, requestId: string, notes: string) {
  return adminService().approveVisibilityRequest(adminId, requestId, notes);
}

export async function rejectVisibilityRequest(adminId: string, requestId: string, reason: string) {
  return adminService().rejectVisibilityRequest(adminId, requestId, reason);
}

export async function listVisibilityRequests() {
  return adminService().listVisibilityRequests();
}

export async function listAdminActions() {
  return adminService().listAdminActions();
}

export async function listReports() {
  return adminService().listReports();
}

export async function resolveReport(adminId: string, reportId: string, reason: string) {
  return adminService().resolveReport(adminId, reportId, reason);
}

export async function hideReview(adminId: string, reviewId: string, reason: string, reportId?: string) {
  return adminService().hideReview(adminId, reviewId, reason, reportId);
}

export async function setUserBanned(adminId: string, userId: string, banned: boolean, reason: string) {
  return adminService().setUserBanned(adminId, userId, banned, reason);
}

export async function listProfessions() {
  return adminService().listProfessions();
}

export async function saveProfession(adminId: string, profession: Profession) {
  return adminService().saveProfession(adminId, profession);
}

export async function setProfessionActive(adminId: string, professionId: string, active: boolean) {
  return adminService().setProfessionActive(adminId, professionId, active);
}
