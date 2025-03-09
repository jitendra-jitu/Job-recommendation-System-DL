
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";

const Navbar = () => {
  const location = useLocation();
  const { isProfileComplete } = useProfile();

  const navLinks = [
    { path: "/all-jobs", label: "All Jobs" },
    { path: "/recommended-jobs", label: "Recommended Jobs" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-job-primary" />
            <span className="font-bold text-xl text-job-primary">Job Recommendation System using CNN</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-job-primary ${
                  location.pathname === link.path
                    ? "text-job-primary border-b-2 border-job-primary"
                    : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Profile Button */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              asChild
            >
              <Link to="/profile">
                <User className="h-5 w-5 mr-2" />
                Profile
                {!isProfileComplete && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
