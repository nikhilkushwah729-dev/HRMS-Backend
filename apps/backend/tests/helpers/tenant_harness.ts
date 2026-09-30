import Employee from '#models/employee'
import Organization from '#models/organization'
import Role from '#models/role'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import SubscriptionService from '#services/SubscriptionService'

export interface TenantUserSet {
  org: Organization
  admin: Employee
  hr: Employee
  manager: Employee
  employee: Employee
}

export interface DualTenantHarness {
  tenantA: TenantUserSet
  tenantB: TenantUserSet
}

export async function setupTestTenants(): Promise<DualTenantHarness> {
  const defaultPasswordHash = await hash.make('Password123!')

  // 1. Ensure System Roles Exist
  const roles = [
    { id: 1, roleName: 'Super Admin', isSystem: true },
    { id: 2, roleName: 'Organization Admin', isSystem: true },
    { id: 3, roleName: 'HR Manager', isSystem: true },
    { id: 4, roleName: 'Manager', isSystem: true },
    { id: 5, roleName: 'Employee', isSystem: true },
  ]
  for (const r of roles) {
    await Role.updateOrCreate({ id: r.id }, r)
  }

  // 2. Provision Tenant A
  const service = new SubscriptionService()
  await service.ensureCatalog()

  const orgA = await Organization.updateOrCreate(
    { id: 1001 },
    {
      companyName: 'Tenant Alpha Inc',
      slug: 'tenant-alpha',
      email: 'contact@tenanta.com',
      isActive: true,
      timezone: 'Asia/Kolkata',
      subscriptionStatus: 'active',
      userLimit: 50,
      planId: 3, // Pro plan
    }
  )

  // Ensure payroll addon active for tenant A test harness
  const payrollAddon = await db.from('addon_prices').where('slug', 'payroll').first()
  if (payrollAddon) {
    const existing = await db.from('organization_addons').where('org_id', orgA.id).where('addon_id', payrollAddon.id).first()
    if (!existing) {
      await db.table('organization_addons').insert({
        org_id: orgA.id,
        addon_id: payrollAddon.id,
        start_date: new Date(),
        is_active: true,
        created_at: new Date(),
      })
    } else {
      await db.from('organization_addons').where('id', existing.id).update({ is_active: true })
    }
  }

  const adminA = await Employee.updateOrCreate(
    { email: 'admin.a@tenanta.com' },
    {
      orgId: orgA.id,
      roleId: 2,
      firstName: 'Admin',
      lastName: 'Alpha',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const hrA = await Employee.updateOrCreate(
    { email: 'hr.a@tenanta.com' },
    {
      orgId: orgA.id,
      roleId: 3,
      firstName: 'HR',
      lastName: 'Alpha',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const managerA = await Employee.updateOrCreate(
    { email: 'manager.a@tenanta.com' },
    {
      orgId: orgA.id,
      roleId: 4,
      firstName: 'Manager',
      lastName: 'Alpha',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const employeeA = await Employee.updateOrCreate(
    { email: 'employee.a@tenanta.com' },
    {
      orgId: orgA.id,
      roleId: 5,
      managerId: managerA.id,
      firstName: 'Employee',
      lastName: 'Alpha',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  // 3. Provision Tenant B
  const orgB = await Organization.updateOrCreate(
    { id: 1002 },
    {
      companyName: 'Tenant Beta Corp',
      slug: 'tenant-beta',
      email: 'contact@tenantb.com',
      isActive: true,
      timezone: 'Asia/Kolkata',
      subscriptionStatus: 'active',
      userLimit: 50,
    }
  )

  const adminB = await Employee.updateOrCreate(
    { email: 'admin.b@tenantb.com' },
    {
      orgId: orgB.id,
      roleId: 2,
      firstName: 'Admin',
      lastName: 'Beta',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const hrB = await Employee.updateOrCreate(
    { email: 'hr.b@tenantb.com' },
    {
      orgId: orgB.id,
      roleId: 3,
      firstName: 'HR',
      lastName: 'Beta',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const managerB = await Employee.updateOrCreate(
    { email: 'manager.b@tenantb.com' },
    {
      orgId: orgB.id,
      roleId: 4,
      firstName: 'Manager',
      lastName: 'Beta',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  const employeeB = await Employee.updateOrCreate(
    { email: 'employee.b@tenantb.com' },
    {
      orgId: orgB.id,
      roleId: 5,
      managerId: managerB.id,
      firstName: 'Employee',
      lastName: 'Beta',
      passwordHash: defaultPasswordHash,
      status: 'active',
      emailVerified: true,
    }
  )

  return {
    tenantA: { org: orgA, admin: adminA, hr: hrA, manager: managerA, employee: employeeA },
    tenantB: { org: orgB, admin: adminB, hr: hrB, manager: managerB, employee: employeeB },
  }
}
