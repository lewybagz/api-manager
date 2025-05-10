import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center text-center text-brand-light p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-brand-light mb-6">
        Welcome to API Credentials Manager
      </h1>
      <p className="text-lg sm:text-xl text-brand-light-secondary mb-8 max-w-2xl">
        Securely store and manage your API keys and credentials for all your
        projects. Client-side encryption ensures your sensitive data remains
        private, even from us.
      </p>
      {user ? (
        <Link
          to="/dashboard"
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-3 px-6 rounded-md text-lg transition-colors shadow-lg"
        >
          Go to Dashboard
        </Link>
      ) : (
        <Link
          to="/login"
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-3 px-6 rounded-md text-lg transition-colors shadow-lg"
        >
          Get Started - Login/Sign Up
        </Link>
      )}
      <div className="mt-12 text-brand-light-secondary">
        <h2 className="text-2xl font-semibold mb-4">Key Features:</h2>
        <ul className="list-disc list-inside space-y-2 text-left max-w-md mx-auto">
          <li>Unlimited Projects and Credentials</li>
          <li>Client-Side AES-256 Encryption</li>
          <li>Master Password Protection</li>
          <li>Easy Copy-to-Clipboard</li>
          <li>Organized and Searchable (Future)</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
