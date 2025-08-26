import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Fingerprint,
  FolderPlus,
  KeyRound,
  Lock,
  LogIn,
  Plus,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

import useAuthStore from "@/stores/authStore";
import useUserStore from "@/stores/userStore";
import { userHasAccessOrBypass } from "@/utils/access";

export default function DocumentationHomepage() {
  const user = useAuthStore((state) => state.user);
  const userDoc = useUserStore((state) => state.userDoc);
  const hasAccess = userHasAccessOrBypass(userDoc);
  const quickNavItems = [
    { icon: BookOpen, id: "overview", label: "Overview" },
    { icon: Shield, id: "security", label: "Security Features" },
    { icon: FolderPlus, id: "features", label: "Core Features" },
    { icon: ArrowRight, id: "getting-started", label: "Getting Started" },
  ];

  const securityFeatures = [
    {
      badge: "Core Security",
      description:
        "Your master password never leaves your device. We can't access your encrypted data, ensuring complete privacy.",
      icon: Fingerprint,
      title: "Zero-Knowledge Encryption",
    },
    {
      badge: "Encryption",
      description:
        "Industry-standard encryption with 310,000 PBKDF2 iterations for maximum security against brute force attacks.",
      icon: Lock,
      title: "AES-256 Encryption",
    },
    {
      badge: "Privacy",
      description:
        "Credentials are masked by default and only revealed when needed, protecting against shoulder surfing.",
      icon: Eye,
      title: "Secure Display",
    },
    {
      badge: "Session Management",
      description:
        "Automatic session timeout and memory clearing after 30 minutes of inactivity for enhanced security.",
      icon: Clock,
      title: "Auto-Lock Protection",
    },
    {
      badge: "Access Control",
      description:
        "Rate limiting and automatic lockout after 5 failed attempts to prevent unauthorized access.",
      icon: AlertTriangle,
      title: "Brute Force Protection",
    },
    {
      badge: "Maintenance",
      description:
        "Continuous security updates and feature enhancements to keep your data safe and secure.",
      icon: RefreshCw,
      title: "Regular Updates",
    },
  ];

  const coreFeatures = [
    {
      description:
        "Organize credentials by project with intuitive management and role-based access control.",
      icon: FolderPlus,
      title: "Project Organization",
    },
    {
      description:
        "All secrets are encrypted client-side with your master password before being stored securely.",
      icon: KeyRound,
      title: "Secure Storage",
    },
    {
      description:
        "Only you can decrypt your data. No one else, not even us, has access to your credentials.",
      icon: Shield,
      title: "Master Password",
    },
    {
      description:
        "Add, edit, and copy credentials with secure clipboard handling and instant access.",
      icon: Plus,
      title: "Quick Operations",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-50">
      <header className="border-b bg-transparent sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 bg-transparent rounded-lg flex items-center justify-center">
                <img
                  alt="Zeker"
                  className="h-16 w-16"
                  src="/assets/logos/logo-loader-128x128.png"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-300">Zeker</h1>
                <p className="text-sm text-slate-600">Powered by Tovuti</p>
              </div>
            </div>
            {!user && (
              <Link
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                to="/pro"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Get Started
              </Link>
            )}
            {user && (
              <Link
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                to={hasAccess ? "/dashboard" : "/pro"}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="bg-slate-800 rounded-xl shadow p-4 mb-6 text-slate-50">
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">
                    Quick Navigation
                  </div>
                </div>
                <div className="space-y-2">
                  {quickNavItems.map((item) => (
                    <a
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700 transition-colors group"
                      href={`#${item.id}`}
                      key={item.id}
                    >
                      <item.icon className="h-4 w-4 text-slate-200 group-hover:text-blue-400" />
                      <span className="text-sm text-slate-100 group-hover:text-blue-400">
                        {item.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {user && (
                <div className="bg-slate-800 rounded-xl shadow p-4">
                  <div className="mb-4">
                    <div className="text-lg font-semibold mb-2">
                      Quick Actions
                    </div>
                  </div>
                  <div className="space-y-3">
                    <a
                      className="w-full flex items-center justify-start px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2"
                      href="/dashboard"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Dashboard
                    </a>
                    <a
                      className="w-full flex items-center justify-start px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors mb-2 bg-transparent"
                      href="/dashboard?action=add-project"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </a>
                    <a
                      className="w-full flex items-center justify-start px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors bg-transparent"
                      href="/dashboard?action=add-credential"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Add Credential
                    </a>
                    <a
                      className="w-full flex items-center justify-start px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors bg-transparent"
                      href="/docs"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Docs
                    </a>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Overview Section */}
            <section id="overview">
              <div className="prose prose-invert prose-slate max-w-none">
                <h1 className="text-4xl font-bold bg-transparent text-slate-50 mb-4 px-2 py-1 rounded">
                  Enterprise-Grade Credential Management
                </h1>
                <p className="text-xl bg-transparent text-slate-50 mb-8 px-2 py-1 rounded">
                  ZekerKey provides enterprise-grade security for your API keys
                  and credentials. Your secrets are encrypted on your device and
                  never leave unencrypted.
                </p>
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-200 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-50 mb-2">
                      Zero-Knowledge Architecture
                    </h3>
                    <p className="text-blue-200">
                      Built with zero-knowledge architecture and military-grade
                      encryption. Your data is encrypted before it leaves your
                      device.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Features Section */}
            <section id="security">
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-transparent text-slate-50 mb-4 px-2 py-1 rounded">
                  Security Features
                </h2>
                <p className="text-lg bg-transparent text-slate-50 px-2 py-1 rounded">
                  Comprehensive security measures to protect your sensitive
                  credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {securityFeatures.map((feature, index) => (
                  <div
                    className="bg-slate-800 rounded-xl shadow hover:shadow-md transition-shadow text-slate-50"
                    key={index}
                  >
                    <div className="p-4 border-b border-slate-700 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5 text-slate-200" />
                        </div>
                        <div className="text-lg font-semibold">
                          {feature.title}
                        </div>
                      </div>
                      <span className="inline-block px-2 py-1 text-xs bg-slate-900 text-slate-50 rounded">
                        {feature.badge}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-slate-200 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Core Features Section */}
            <section id="features">
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-transparent text-slate-50 mb-4 px-2 py-1 rounded">
                  Core Features
                </h2>
                <p className="text-lg bg-transparent text-slate-50 px-2 py-1 rounded">
                  Everything you need to manage your API credentials securely
                  and efficiently.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coreFeatures.map((feature, index) => (
                  <div
                    className="bg-slate-800 rounded-xl shadow hover:shadow-md transition-shadow text-slate-50"
                    key={index}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-slate-200 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Getting Started Section */}
            <section id="getting-started">
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-transparent text-slate-50 mb-4 px-2 py-1 rounded">
                  Getting Started
                </h2>
                <p className="text-lg bg-transparent text-slate-50 px-2 py-1 rounded">
                  Follow these steps to start securing your credentials with
                  Zeker.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="md:w-8 h-8 bg-slate-900 text-blue-400 md:rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-2">
                          Create Your Account
                        </h3>
                        <p className="text-slate-200 mb-4">
                          Sign up for a ZekerKey account and set up your master
                          password. This password will be used to encrypt all
                          your data.
                        </p>
                        {!user && (
                          <a
                            className="inline-flex items-center px-4 py-2 text-blue-600 bg-slate-50 rounded-lg hover:bg-slate-200 transition-colors"
                            href="/login"
                          >
                            <LogIn className="h-4 w-4 mr-2 text-blue-600" />
                            Sign Up Now
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-slate-900 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-2">
                          Create Your First Project
                        </h3>
                        <p className="text-slate-200">
                          Organize your credentials by creating projects. Each
                          project can contain multiple API keys and credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-slate-900 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-2">
                          Add Your Credentials
                        </h3>
                        <p className="text-slate-200">
                          Start adding your API keys, tokens, and other
                          sensitive credentials. They'll be encrypted
                          automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
