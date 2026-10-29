import { adminWorkspaces, workspaceLinks } from './admin-navigation';

/** Default landing page only; server permissions still guard every destination. */
export function loginDestination(permissions:string[]) {
 if(['leads.read','quotations.read','orders.read','delivery.read'].some(permission=>permissions.includes(permission)))return '/admin';
 const workspace=adminWorkspaces.find(item=>workspaceLinks(item,permissions).length);
 if(workspace)return '/admin/workspaces/'+workspace.key;
 if(permissions.includes('reports.read')||permissions.includes('finance.read'))return '/admin/reports';
 return '/account';
}
