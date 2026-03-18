import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.proposalSection.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@invoiceai.com",
      password: hashedPassword,
      name: "Alex Johnson",
      businessName: "AJ Digital Studio",
      address: "123 Creative Lane, San Francisco, CA 94102",
      phone: "+1 (555) 123-4567",
      taxNumber: "TAX-2024-AJ001",
      currency: "USD",
      defaultTaxRate: 8.5,
      defaultPaymentTerms:
        "Payment due within 30 days. We accept bank transfer and PayPal. Thank you for your business!",
      defaultDueDays: 30,
      aiContext:
        "Full-stack web developer with 7 years of experience specializing in React, Next.js, and Node.js applications.",
    },
  });

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Sarah Mitchell",
        email: "sarah@techstartup.io",
        phone: "+1 (555) 234-5678",
        company: "TechStartup Inc.",
        address: "456 Innovation Blvd, Austin, TX 73301",
        notes: "Prefers communication via email. Quick decision-maker.",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Marcus Chen",
        email: "marcus@designhub.co",
        phone: "+1 (555) 345-6789",
        company: "DesignHub Co.",
        address: "789 Pixel Drive, Portland, OR 97201",
        notes: "Detail-oriented, likes weekly status updates.",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Emily Rodriguez",
        email: "emily@greenearth.org",
        company: "GreenEarth Foundation",
        address: "321 Sustainability Way, Denver, CO 80201",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "James O'Brien",
        email: "james@obrienlegal.com",
        phone: "+1 (555) 456-7890",
        company: "O'Brien Legal Partners",
        address: "555 Justice Ave, Chicago, IL 60601",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Priya Sharma",
        email: "priya@cloudnine.dev",
        phone: "+1 (555) 567-8901",
        company: "CloudNine Solutions",
        notes: "Recurring client, priority support.",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "David Kim",
        email: "david@freshbites.com",
        company: "FreshBites Restaurant",
        address: "888 Culinary St, Seattle, WA 98101",
      },
    }),
  ]);

  const [sarah, marcus, emily, james, priya, david] = clients;

  // Helper to create dates relative to now
  const daysAgo = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Create invoices with varied statuses and dates spread over 6 months
  const invoices = [
    {
      clientId: sarah.id,
      invoiceNumber: "INV-2026-001",
      status: "PAID",
      issueDate: daysAgo(150),
      dueDate: daysAgo(120),
      subtotal: 4500,
      taxRate: 8.5,
      taxAmount: 382.5,
      total: 4882.5,
      notes: "Website redesign - Phase 1. Thank you for prompt payment!",
      items: [
        { description: "UI/UX Design & Wireframing", quantity: 20, unitPrice: 75, total: 1500 },
        { description: "Frontend Development (React)", quantity: 30, unitPrice: 85, total: 2550 },
        { description: "QA Testing & Bug Fixes", quantity: 6, unitPrice: 75, total: 450 },
      ],
    },
    {
      clientId: sarah.id,
      invoiceNumber: "INV-2026-002",
      status: "PAID",
      issueDate: daysAgo(90),
      dueDate: daysAgo(60),
      subtotal: 3200,
      taxRate: 8.5,
      taxAmount: 272,
      total: 3472,
      notes: "Website redesign - Phase 2.",
      items: [
        { description: "Backend API Development (Node.js)", quantity: 25, unitPrice: 85, total: 2125 },
        { description: "Database Design & Migration", quantity: 8, unitPrice: 85, total: 680 },
        { description: "Performance Optimization", quantity: 5, unitPrice: 79, total: 395 },
      ],
    },
    {
      clientId: marcus.id,
      invoiceNumber: "INV-2026-003",
      status: "PAID",
      issueDate: daysAgo(120),
      dueDate: daysAgo(90),
      subtotal: 2800,
      taxRate: 0,
      taxAmount: 0,
      total: 2800,
      notes: "Portfolio website development. Payment received via bank transfer.",
      items: [
        { description: "Custom Portfolio Template Design", quantity: 1, unitPrice: 1200, total: 1200 },
        { description: "Responsive Development", quantity: 16, unitPrice: 75, total: 1200 },
        { description: "CMS Integration (Sanity)", quantity: 5, unitPrice: 80, total: 400 },
      ],
    },
    {
      clientId: emily.id,
      invoiceNumber: "INV-2026-004",
      status: "SENT",
      issueDate: daysAgo(20),
      dueDate: daysFromNow(10),
      subtotal: 5600,
      taxRate: 8.5,
      taxAmount: 476,
      total: 6076,
      notes: "Donation platform development. Net 30 terms.",
      items: [
        { description: "Donation Platform Architecture", quantity: 10, unitPrice: 90, total: 900 },
        { description: "Payment Gateway Integration (Stripe)", quantity: 15, unitPrice: 90, total: 1350 },
        { description: "Frontend Dashboard Development", quantity: 25, unitPrice: 85, total: 2125 },
        { description: "Email Notification System", quantity: 8, unitPrice: 85, total: 680 },
        { description: "Deployment & DevOps Setup", quantity: 6, unitPrice: 90.83, total: 545 },
      ],
    },
    {
      clientId: james.id,
      invoiceNumber: "INV-2026-005",
      status: "OVERDUE",
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      subtotal: 1800,
      taxRate: 8.5,
      taxAmount: 153,
      total: 1953,
      notes: "Legal portal enhancements. OVERDUE — please remit payment.",
      items: [
        { description: "Document Upload Module", quantity: 12, unitPrice: 85, total: 1020 },
        { description: "Client Portal UI Updates", quantity: 8, unitPrice: 75, total: 600 },
        { description: "Security Audit & Patches", quantity: 2, unitPrice: 90, total: 180 },
      ],
    },
    {
      clientId: priya.id,
      invoiceNumber: "INV-2026-006",
      status: "PAID",
      issueDate: daysAgo(45),
      dueDate: daysAgo(15),
      subtotal: 7200,
      taxRate: 8.5,
      taxAmount: 612,
      total: 7812,
      notes: "SaaS dashboard development — monthly retainer.",
      aiGenerated: true,
      items: [
        { description: "Dashboard UI Components (React/Tailwind)", quantity: 30, unitPrice: 85, total: 2550 },
        { description: "Real-time Data Visualization (Recharts)", quantity: 15, unitPrice: 90, total: 1350 },
        { description: "REST API Development", quantity: 20, unitPrice: 85, total: 1700 },
        { description: "Authentication & RBAC Implementation", quantity: 10, unitPrice: 90, total: 900 },
        { description: "Automated Testing Suite", quantity: 8, unitPrice: 87.5, total: 700 },
      ],
    },
    {
      clientId: david.id,
      invoiceNumber: "INV-2026-007",
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: daysFromNow(30),
      subtotal: 2400,
      taxRate: 8.5,
      taxAmount: 204,
      total: 2604,
      notes: "Restaurant website with online ordering.",
      items: [
        { description: "Restaurant Website Design", quantity: 1, unitPrice: 800, total: 800 },
        { description: "Online Menu & Ordering System", quantity: 12, unitPrice: 85, total: 1020 },
        { description: "Google Maps Integration & SEO", quantity: 4, unitPrice: 75, total: 300 },
        { description: "Mobile Responsiveness Testing", quantity: 4, unitPrice: 70, total: 280 },
      ],
    },
    {
      clientId: priya.id,
      invoiceNumber: "INV-2026-008",
      status: "SENT",
      issueDate: daysAgo(5),
      dueDate: daysFromNow(25),
      subtotal: 3600,
      taxRate: 8.5,
      taxAmount: 306,
      total: 3906,
      notes: "SaaS dashboard — March retainer.",
      items: [
        { description: "New Analytics Module", quantity: 15, unitPrice: 90, total: 1350 },
        { description: "User Management Enhancements", quantity: 12, unitPrice: 85, total: 1020 },
        { description: "Performance Optimization & Caching", quantity: 8, unitPrice: 85, total: 680 },
        { description: "Bug Fixes & Maintenance", quantity: 6, unitPrice: 91.67, total: 550 },
      ],
    },
  ];

  for (const inv of invoices) {
    await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: inv.clientId,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        taxRate: inv.taxRate,
        taxAmount: inv.taxAmount,
        total: inv.total,
        notes: inv.notes,
        aiGenerated: inv.aiGenerated ?? false,
        lineItems: {
          create: inv.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            order: i,
          })),
        },
      },
    });
  }

  console.log(`  Created ${invoices.length} invoices`);

  // Create proposals
  const proposals = [
    {
      clientId: sarah.id,
      proposalNumber: "PROP-2026-001",
      status: "ACCEPTED",
      title: "E-Commerce Platform Development",
      validUntil: daysAgo(30),
      total: 15000,
      sections: [
        { title: "Executive Summary", content: "We propose to build a modern, scalable e-commerce platform for TechStartup Inc. that will support your growing product catalog, streamline the checkout experience, and integrate with your existing inventory management system." },
        { title: "Scope of Work", content: "- Custom product catalog with advanced filtering and search\n- Shopping cart with guest and registered checkout\n- Stripe payment gateway integration\n- Admin dashboard for order management\n- Inventory sync via REST API\n- Email notifications (order confirmation, shipping updates)\n- Mobile-responsive design across all pages" },
        { title: "Timeline", content: "Phase 1 (Weeks 1-3): Design & Architecture\nPhase 2 (Weeks 4-8): Core Development\nPhase 3 (Weeks 9-10): Testing & QA\nPhase 4 (Week 11): Deployment & Launch Support" },
        { title: "Investment", content: "The total project investment is $15,000, broken down as follows:\n- Design & Architecture: $3,000\n- Frontend Development: $5,000\n- Backend & API Development: $4,500\n- Testing & QA: $1,500\n- Deployment & Launch: $1,000" },
      ],
    },
    {
      clientId: marcus.id,
      proposalNumber: "PROP-2026-002",
      status: "SENT",
      title: "Design System & Component Library",
      validUntil: daysFromNow(15),
      total: 8500,
      sections: [
        { title: "Executive Summary", content: "A comprehensive design system and React component library for DesignHub Co. that ensures brand consistency across all digital products and accelerates development velocity." },
        { title: "Scope of Work", content: "- Design tokens (colors, typography, spacing, shadows)\n- 25+ reusable React components with Storybook documentation\n- Figma component library synced with code\n- Accessibility compliance (WCAG 2.1 AA)\n- Automated visual regression testing\n- NPM package for internal distribution" },
        { title: "Timeline", content: "Total duration: 6 weeks\n- Week 1-2: Design token system & foundational components\n- Week 3-4: Complex components & patterns\n- Week 5: Documentation & Storybook\n- Week 6: Testing, packaging & handover" },
        { title: "Investment", content: "Total: $8,500\n- Design System Architecture: $2,000\n- Component Development: $4,000\n- Documentation & Storybook: $1,500\n- Testing & Packaging: $1,000" },
      ],
    },
    {
      clientId: emily.id,
      proposalNumber: "PROP-2026-003",
      status: "DRAFT",
      title: "Volunteer Management Portal",
      validUntil: daysFromNow(30),
      total: 12000,
      aiGenerated: true,
      sections: [
        { title: "Executive Summary", content: "A purpose-built volunteer management portal for GreenEarth Foundation to streamline volunteer recruitment, scheduling, hour tracking, and impact reporting." },
        { title: "Project Understanding", content: "GreenEarth Foundation needs a centralized platform to manage its growing volunteer base of 500+ active volunteers across 12 program areas. Current spreadsheet-based tracking is unsustainable." },
        { title: "Scope of Work", content: "- Volunteer registration & onboarding flow\n- Event/shift scheduling with calendar integration\n- Hour logging & approval workflow\n- Impact dashboard with exportable reports\n- Automated email reminders & notifications\n- Admin panel for program coordinators\n- Mobile-responsive design" },
        { title: "Timeline & Milestones", content: "8-week development cycle:\n- Weeks 1-2: Discovery, design, and architecture\n- Weeks 3-5: Core platform development\n- Weeks 6-7: Admin features and reporting\n- Week 8: UAT, bug fixes, and deployment" },
        { title: "Investment", content: "Total project investment: $12,000\n- Discovery & Design: $2,400\n- Core Development: $5,400\n- Admin & Reporting: $2,400\n- Testing & Deployment: $1,800" },
        { title: "Why Choose Us", content: "With 7 years of full-stack experience and a portfolio of successful non-profit projects, we understand the unique needs of mission-driven organizations. Our agile approach ensures transparency and flexibility throughout the project." },
      ],
    },
    {
      clientId: priya.id,
      proposalNumber: "PROP-2026-004",
      status: "ACCEPTED",
      title: "SaaS Dashboard - Phase 2 Expansion",
      validUntil: daysAgo(10),
      total: 22000,
      sections: [
        { title: "Executive Summary", content: "Phase 2 expansion of the CloudNine Solutions SaaS dashboard, adding multi-tenancy, advanced analytics, and white-label capabilities." },
        { title: "Scope of Work", content: "- Multi-tenant architecture with data isolation\n- Advanced analytics engine with custom report builder\n- White-label theming system\n- Role-based access control enhancements\n- Webhook system for third-party integrations\n- Performance optimization for 10x scale" },
        { title: "Timeline", content: "12-week timeline:\n- Weeks 1-3: Multi-tenancy architecture\n- Weeks 4-7: Analytics engine\n- Weeks 8-10: White-label & RBAC\n- Weeks 11-12: Performance tuning & launch" },
        { title: "Investment", content: "Total: $22,000\nBroken into monthly milestones with 30% upfront, 3 monthly installments of 23.3% each." },
      ],
    },
    {
      clientId: james.id,
      proposalNumber: "PROP-2026-005",
      status: "REJECTED",
      title: "Legal Document Automation System",
      validUntil: daysAgo(45),
      total: 18000,
      sections: [
        { title: "Executive Summary", content: "An AI-powered document automation system for O'Brien Legal Partners to generate, review, and manage legal documents with template-based workflows." },
        { title: "Scope of Work", content: "- Document template engine with variable substitution\n- AI-powered clause suggestions\n- Version control & audit trail\n- Client portal for document review & e-signatures\n- Integration with existing case management system" },
        { title: "Investment", content: "Total: $18,000 over 10 weeks." },
      ],
    },
  ];

  for (const prop of proposals) {
    await prisma.proposal.create({
      data: {
        userId: user.id,
        clientId: prop.clientId,
        proposalNumber: prop.proposalNumber,
        status: prop.status,
        title: prop.title,
        validUntil: prop.validUntil,
        total: prop.total,
        aiGenerated: prop.aiGenerated ?? false,
        sections: {
          create: prop.sections.map((section, i) => ({
            title: section.title,
            content: section.content,
            order: i,
          })),
        },
      },
    });
  }

  console.log(`  Created ${proposals.length} proposals`);
  console.log(`  Created ${clients.length} clients`);
  console.log("  Created 1 demo user (demo@invoiceai.com / password123)");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
