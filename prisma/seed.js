import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// Development credentials only. Never reuse these passwords outside local development.
const seedPassword = "TaskFlowDev!2026";

const organizations = [
	{ id: "00000000-0000-4000-8000-000000000001", name: "Acme Operations", slug: "acme-operations" },
	{ id: "00000000-0000-4000-8000-000000000002", name: "Northwind Labs", slug: "northwind-labs" },
];

const users = [
	{ id: "00000000-0000-4000-8000-000000000011", name: "Alice Admin", email: "alice@acme.test" },
	{ id: "00000000-0000-4000-8000-000000000012", name: "Ben Member", email: "ben@acme.test" },
	{ id: "00000000-0000-4000-8000-000000000013", name: "Cara Member", email: "cara@acme.test" },
	{ id: "00000000-0000-4000-8000-000000000014", name: "Diego Admin", email: "diego@northwind.test" },
	{ id: "00000000-0000-4000-8000-000000000015", name: "Eva Member", email: "eva@northwind.test" },
];

const memberships = [
	{ id: "00000000-0000-4000-8000-000000000101", organizationId: organizations[0].id, userId: users[0].id, role: "ORG_ADMIN" },
	{ id: "00000000-0000-4000-8000-000000000102", organizationId: organizations[0].id, userId: users[1].id, role: "MEMBER" },
	{ id: "00000000-0000-4000-8000-000000000103", organizationId: organizations[0].id, userId: users[2].id, role: "MEMBER" },
	{ id: "00000000-0000-4000-8000-000000000104", organizationId: organizations[1].id, userId: users[3].id, role: "ORG_ADMIN" },
	{ id: "00000000-0000-4000-8000-000000000105", organizationId: organizations[1].id, userId: users[4].id, role: "MEMBER" },
];

const projects = [
	{ id: "00000000-0000-4000-8000-000000000201", organizationId: organizations[0].id, name: "Website Refresh", description: "Acme public website delivery." },
	{ id: "00000000-0000-4000-8000-000000000202", organizationId: organizations[0].id, name: "Operations Hub", description: "Internal operations improvements." },
	{ id: "00000000-0000-4000-8000-000000000203", organizationId: organizations[1].id, name: "Research Portal", description: "Northwind research tooling." },
];

const tasks = [
	{ id: "00000000-0000-4000-8000-000000000301", projectId: projects[0].id, title: "Create sitemap", status: "DONE", priority: "LOW", dueDate: "2026-09-01T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000302", projectId: projects[0].id, title: "Build landing page", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-09-10T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000303", projectId: projects[0].id, title: "Review accessibility", status: "REVIEW", priority: "MEDIUM", dueDate: "2026-09-15T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000304", projectId: projects[0].id, title: "Plan analytics events", status: "TODO", priority: "URGENT", dueDate: null },
	{ id: "00000000-0000-4000-8000-000000000305", projectId: projects[1].id, title: "Document runbooks", status: "DONE", priority: "MEDIUM", dueDate: "2026-09-05T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000306", projectId: projects[1].id, title: "Automate weekly report", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-09-18T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000307", projectId: projects[1].id, title: "Audit permissions", status: "REVIEW", priority: "URGENT", dueDate: "2026-09-20T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000308", projectId: projects[1].id, title: "Collect team feedback", status: "TODO", priority: "LOW", dueDate: null },
	{ id: "00000000-0000-4000-8000-000000000309", projectId: projects[2].id, title: "Define experiment schema", status: "DONE", priority: "HIGH", dueDate: "2026-09-02T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000310", projectId: projects[2].id, title: "Implement data import", status: "IN_PROGRESS", priority: "URGENT", dueDate: "2026-09-12T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000311", projectId: projects[2].id, title: "Review experiment dashboard", status: "REVIEW", priority: "MEDIUM", dueDate: "2026-09-22T00:00:00.000Z" },
	{ id: "00000000-0000-4000-8000-000000000312", projectId: projects[2].id, title: "Prepare user guide", status: "TODO", priority: "LOW", dueDate: null },
];

const assignments = [
	{ id: "00000000-0000-4000-8000-000000000401", taskId: tasks[1].id, userId: users[1].id },
	{ id: "00000000-0000-4000-8000-000000000402", taskId: tasks[2].id, userId: users[2].id },
	{ id: "00000000-0000-4000-8000-000000000403", taskId: tasks[5].id, userId: users[0].id },
	{ id: "00000000-0000-4000-8000-000000000404", taskId: tasks[6].id, userId: users[2].id },
	{ id: "00000000-0000-4000-8000-000000000405", taskId: tasks[9].id, userId: users[4].id },
	{ id: "00000000-0000-4000-8000-000000000406", taskId: tasks[10].id, userId: users[3].id },
];

const comments = [
	{ id: "00000000-0000-4000-8000-000000000501", taskId: tasks[1].id, authorId: users[1].id, content: "The first draft is ready for review." },
	{ id: "00000000-0000-4000-8000-000000000502", taskId: tasks[2].id, authorId: users[0].id, content: "Please include keyboard navigation in the checklist." },
	{ id: "00000000-0000-4000-8000-000000000503", taskId: tasks[9].id, authorId: users[4].id, content: "The import handles the sample dataset successfully." },
];

const upsert = async (tx, model, record) => {
	const { id, ...data } = record;
	return tx[model].upsert({
		where: { id },
		create: { id, ...data },
		update: data,
	});
};

const main = async () => {
	const passwordHash = await bcrypt.hash(seedPassword, 12);

	await prisma.$transaction(async (tx) => {
		for (const organization of organizations) await upsert(tx, "organization", organization);
		for (const user of users) await upsert(tx, "user", { ...user, passwordHash });
		for (const membership of memberships) await upsert(tx, "orgMember", membership);
		for (const project of projects) await upsert(tx, "project", project);
		for (const task of tasks) await upsert(tx, "task", { ...task, dueDate: task.dueDate ? new Date(task.dueDate) : null });
		for (const assignment of assignments) await upsert(tx, "taskAssignment", assignment);
		for (const comment of comments) await upsert(tx, "comment", comment);
	});

	console.log(`Seeded ${organizations.length} organizations, ${users.length} users, ${projects.length} projects, and ${tasks.length} tasks.`);
	console.log(`Development password for all seeded users: ${seedPassword}`);
};

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
