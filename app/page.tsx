"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  FileText,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Drafts in Seconds",
    description:
      "Describe the project once and let Claude generate polished line items and proposal sections instantly.",
  },
  {
    icon: FileText,
    title: "Branded PDF Export",
    description:
      "Generate client-ready PDFs with your logo, terms, and totals that look consistent every time.",
  },
  {
    icon: Mail,
    title: "Send from One Place",
    description:
      "Email invoices and proposals directly from the app with personal notes and professional templates.",
  },
  {
    icon: Users,
    title: "Client Workspace",
    description:
      "Track all clients, invoices, and proposals in one clean dashboard built for freelancers.",
  },
];

const steps = [
  {
    step: "01",
    title: "Describe",
    detail: "Add your client, scope, timeline, and pricing model.",
  },
  {
    step: "02",
    title: "Generate",
    detail: "AI drafts the structure, totals are calculated, and PDFs are ready.",
  },
  {
    step: "03",
    title: "Send",
    detail: "Send instantly, track status, and close faster without admin drag.",
  },
];

const testimonials = [
  {
    quote:
      "I went from messy docs to a repeatable workflow. I send proposals in half the time now.",
    name: "Nina R.",
    role: "Brand Designer",
  },
  {
    quote:
      "The AI line items are shockingly good. I tweak a few words and ship.",
    name: "Hassan M.",
    role: "Full-Stack Freelancer",
  },
  {
    quote:
      "PDF + email in one flow is exactly what solo consultants need.",
    name: "Eva T.",
    role: "Marketing Consultant",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Home() {
  return (
    <div className="relative overflow-x-clip bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-12rem] top-[18rem] h-[26rem] w-[26rem] rounded-full bg-amber-500/20 blur-[130px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">InvoiceAI</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Start Free
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 pt-8 sm:px-6 md:pb-24 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-cyan-200">
              Freelancer Workflow, Rebuilt
            </span>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Turn rough project notes into
              <span className="bg-gradient-to-r from-cyan-300 to-amber-200 bg-clip-text text-transparent">
                {" "}
                client-ready docs
              </span>
              .
            </h1>

            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              InvoiceAI helps solo professionals draft invoices and proposals with AI,
              export branded PDFs, and send everything in minutes.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/30 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-cyan-300" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-cyan-300" />
                AI-assisted drafts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-cyan-300" />
                Export + send built in
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-white/15 bg-slate-900/60 p-4 shadow-2xl shadow-cyan-950/50 backdrop-blur"
          >
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Live Preview</p>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Draft Ready
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Invoice Number</p>
                  <p className="mt-1 font-mono text-sm text-slate-100">INV-2026-014</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="mt-1 text-sm text-slate-100">Northlane Studio</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-400">AI Generated Items</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
                    <li>Brand Strategy Workshop - $800</li>
                    <li>UI Design System - $1,200</li>
                    <li>Landing Page Build - $1,650</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-white p-3 text-slate-900">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total</p>
                  <p className="mt-1 font-mono text-xl font-semibold">$3,650.00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-8"
          >
            <motion.div variants={item} className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Everything you need to go from idea to paid.
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={item}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <feature.icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-3 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8"
          >
            <motion.h2 variants={item} className="text-3xl font-semibold text-white">
              How It Works
            </motion.h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <motion.div key={step.step} variants={item} className="rounded-xl bg-white/[0.03] p-5">
                  <p className="font-mono text-sm text-cyan-300">{step.step}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-6"
          >
            <motion.h2 variants={item} className="text-3xl font-semibold text-white">
              Trusted by freelancers doing real client work.
            </motion.h2>

            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <motion.figure
                  key={testimonial.name}
                  variants={item}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <blockquote className="text-sm leading-7 text-slate-200">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{testimonial.name}</span>
                    {" • "}
                    {testimonial.role}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-300/10 via-cyan-300/10 to-emerald-300/10 p-6 sm:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold text-white">Simple pricing for solo businesses.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start free. Upgrade later as your client volume grows.
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Starter</p>
                <p className="mt-2 text-4xl font-semibold text-white">
                  $0<span className="text-base font-medium text-slate-400">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    AI invoice and proposal drafts
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    PDF export and email sending
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    Client and status tracking
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} InvoiceAI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:text-slate-200">
              Sign In
            </Link>
            <Link href="/register" className="transition hover:text-slate-200">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
