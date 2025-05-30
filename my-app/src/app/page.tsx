import React from 'react';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutralDark mb-4">
        Welcome to the Dashboard
      </h1>
      <p className="text-neutralTextSecondary">
        This is the main content area. The new layout with TopBar and Sidebar should be visible.
      </p>
      {/* You can add more placeholder content here if needed */}
      <div className="mt-6 p-6 bg-white rounded-radiusMedium shadow">
        <h2 className="text-lg font-medium text-neutralDark">Sample Card</h2>
        <p className="mt-2 text-sm text-neutralTextSecondary">
          This is a sample card element within the main content area to demonstrate content flow and styling.
          The background of this card is white, and the page background (visible as padding around this card)
          should be `neutralLighter` as set in AppLayout and RootLayout's body.
        </p>
      </div>
    </div>
  );
}
