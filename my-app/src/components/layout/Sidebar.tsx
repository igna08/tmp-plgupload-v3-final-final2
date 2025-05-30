import React from 'react';

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean; // Will be used later
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, children, isActive }) => {
  return (
    <a
      href={href}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-radiusSmall
                  text-neutralDark hover:bg-neutralLighter group
                  ${isActive ? 'bg-neutralLight font-semibold' : ''}`}
    >
      {icon && <span className="text-neutralTextSecondary group-hover:text-neutralDark">{icon}</span>}
      <span className="text-sm">{children}</span>
    </a>
  );
};

interface SidebarProps {
  isMobileOpen?: boolean; // For mobile toggle, to be implemented later
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen }) => {
  const navItems = [
    { label: 'Dashboard', href: '#', icon: <HomeIcon /> },
    { label: 'Schools', href: '#', icon: <SchoolIcon /> },
    { label: 'Assets', href: '#', icon: <AssetIcon /> },
    { label: 'Admin', href: '#', icon: <AdminIcon /> },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-60 bg-neutralLightest border-r border-neutralLight
                  transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                  transition-transform duration-300 ease-in-out
                  flex-shrink-0 md:relative md:h-auto md:overflow-y-auto`} // md:relative for desktop layout flow
      aria-label="Sidebar"
    >
      <div className="py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.label} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

// Placeholder Icons (simple SVGs or characters)
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M21 12v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 21v-9m18 0l-9-9M2.25 12l9-9m0 0l9 9" />
  </svg>
);
const SchoolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);
const AssetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3-3m3 3l3-3m-3 3v6m0 0H9m3 0h3m3 0h-3m-6 0H6m15 0H9" />
  </svg>
);
const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export default Sidebar;
