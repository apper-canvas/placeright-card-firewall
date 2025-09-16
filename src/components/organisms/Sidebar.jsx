import { NavLink } from "react-router-dom";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import { useRole } from "@/hooks/useRole";

const Sidebar = ({ isOpen, onClose }) => {
  const { currentRole } = useRole();

const candidateNavItems = [
    { name: "Dashboard", path: "/", icon: "LayoutDashboard" },
    { name: "Job Board", path: "/jobs", icon: "Search" },
    { name: "Saved Jobs", path: "/saved-jobs", icon: "Heart" },
    { name: "My Applications", path: "/applications", icon: "FileText" },
{ name: "Messages", path: "/messages", icon: "MessageSquare" },
    { name: "Contact Us", path: "/contact-us", icon: "Mail" },
    { name: "Profile", path: "/profile", icon: "User" },
    { name: "Tasks", path: "/tasks", icon: "List" },
  ];
const recruiterNavItems = [
    { name: "Dashboard", path: "/", icon: "LayoutDashboard" },
{ name: "Job Postings", path: "/jobs", icon: "Briefcase" },
    { name: "Candidates", path: "/candidates", icon: "Users" },
    { name: "Saved Candidates", path: "/saved-candidates", icon: "Heart" },
    { name: "Applications", path: "/applications", icon: "FileText" },
    { name: "Messages", path: "/messages", icon: "MessageSquare" },
    { name: "Contact Us", path: "/contact-us", icon: "Mail" },
    { name: "Profile", path: "/profile", icon: "Building2" }
  ];

  const navItems = currentRole === "candidate" ? candidateNavItems : recruiterNavItems;

  return (
    <>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`} onClick={onClose} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between lg:justify-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <ApperIcon name="Briefcase" className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">PlaceRight</span>
              </div>
              <button 
                onClick={onClose}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <ApperIcon name="X" className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                  }`
                }
              >
                <ApperIcon name={item.icon} className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-accent/10 to-accent/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Contact our support team for assistance with your {currentRole === "candidate" ? "job search" : "hiring needs"}.
              </p>
<NavLink
                to="/contact-us"
                className="text-sm text-accent font-medium hover:underline transition-colors"
                onClick={onClose}
              >
                Get Support
              </NavLink>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;